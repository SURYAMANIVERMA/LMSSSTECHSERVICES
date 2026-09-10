import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "SS TECH SERVICES <onboarding@resend.dev>";
const WA_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // --- Auth: must be a signed-in admin or trainer -------------------------
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: userRes } = await admin.auth.getUser(token);
  const user = userRes?.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
  const allowed = (roles ?? []).some((r: { role: string }) => r.role === "admin" || r.role === "trainer");
  if (!allowed) return json({ error: "Forbidden" }, 403);

  // --- Input -------------------------------------------------------------
  let body: { certificate_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const id = body.certificate_id;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: { certificate_id: ["A valid certificate id is required"] } }, 400);

  const { data: cert, error: certErr } = await admin
    .from("certificates")
    .select("id,certificate_no,course_title,student_name,student_id,student_email,student_phone,issued_at,status")
    .eq("id", id)
    .maybeSingle();
  if (certErr || !cert) return json({ error: "Certificate not found" }, 404);

  const { data: profile } = await admin.from("profiles").select("email,phone,display_name").eq("id", cert.student_id).maybeSingle();
  const email = cert.student_email ?? profile?.email ?? null;
  const phoneRaw = (cert.student_phone ?? profile?.phone ?? "").replace(/[^0-9]/g, "");
  const phone = phoneRaw ? (phoneRaw.length === 10 ? `91${phoneRaw}` : phoneRaw) : null;
  const name = cert.student_name ?? profile?.display_name ?? "Student";

  const subject = `Your ${cert.course_title ?? "course"} certificate is ready — SS TECH SERVICES`;
  const text =
    `Congratulations ${name}!\n\n` +
    `Your certificate for "${cert.course_title ?? "your course"}" has been approved and issued by SS TECH SERVICES.\n` +
    `Certificate No: ${cert.certificate_no}\n` +
    `Issued on: ${new Date(cert.issued_at).toLocaleDateString("en-IN")}\n\n` +
    `Sign in to the LMS and download your PDF from My Learning.\n\n— SS TECH SERVICES, Lucknow`;

  const results: Record<string, string> = {};

  // --- Email -------------------------------------------------------------
  if (!email) {
    results.email = "skipped";
    await admin.from("notification_log").insert({ certificate_id: cert.id, channel: "email", recipient: null, status: "skipped", subject, body: text, error_message: "No email on file for this student" });
  } else if (!RESEND_API_KEY) {
    results.email = "queued";
    await admin.from("notification_log").insert({ certificate_id: cert.id, channel: "email", recipient: email, status: "queued", subject, body: text, error_message: "Email sending is not configured yet (no provider key)" });
  } else {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [email],
          subject,
          html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#0f2244">
            <h2 style="color:#0f2244">Congratulations ${name}!</h2>
            <p>Your certificate for <strong>${cert.course_title ?? "your course"}</strong> has been approved and issued by <strong>SS TECH SERVICES</strong>.</p>
            <p><strong>Certificate No:</strong> ${cert.certificate_no}<br/>
            <strong>Issued on:</strong> ${new Date(cert.issued_at).toLocaleDateString("en-IN")}</p>
            <p>Sign in to the LMS and download your PDF from <em>My Learning</em>.</p>
            <p style="color:#5a6478;font-size:12px">SS TECH SERVICES · Lucknow, Uttar Pradesh, India</p>
          </div>`,
        }),
      });
      const ok = res.ok;
      const errText = ok ? null : await res.text();
      results.email = ok ? "sent" : "failed";
      await admin.from("notification_log").insert({ certificate_id: cert.id, channel: "email", recipient: email, status: ok ? "sent" : "failed", subject, body: text, error_message: errText });
    } catch (e) {
      results.email = "failed";
      await admin.from("notification_log").insert({ certificate_id: cert.id, channel: "email", recipient: email, status: "failed", subject, body: text, error_message: String(e) });
    }
  }

  // --- WhatsApp ----------------------------------------------------------
  let waLink: string | null = null;
  if (!phone) {
    results.whatsapp = "skipped";
    await admin.from("notification_log").insert({ certificate_id: cert.id, channel: "whatsapp", recipient: null, status: "skipped", body: text, error_message: "No phone number on file for this student" });
  } else {
    waLink = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    if (WA_TOKEN && WA_PHONE_ID) {
      try {
        const res = await fetch(`https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`, {
          method: "POST",
          headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "text", text: { body: text } }),
        });
        const ok = res.ok;
        const errText = ok ? null : await res.text();
        results.whatsapp = ok ? "sent" : "failed";
        await admin.from("notification_log").insert({ certificate_id: cert.id, channel: "whatsapp", recipient: phone, status: ok ? "sent" : "failed", body: text, error_message: errText });
      } catch (e) {
        results.whatsapp = "failed";
        await admin.from("notification_log").insert({ certificate_id: cert.id, channel: "whatsapp", recipient: phone, status: "failed", body: text, error_message: String(e) });
      }
    } else {
      results.whatsapp = "queued";
      await admin.from("notification_log").insert({ certificate_id: cert.id, channel: "whatsapp", recipient: phone, status: "queued", body: text, error_message: "WhatsApp Business API not configured — use the click-to-chat link" });
    }
  }

  return json({ ok: true, results, whatsapp_link: waLink, email, phone });
});
