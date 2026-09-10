import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function normalizeMobile(raw: string): string | null {
  const d = raw.replace(/[^0-9]/g, "");
  if (d.length === 10) return `+91${d}`;
  if (d.length === 12 && d.startsWith("91")) return `+${d}`;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // --- authenticate the caller and require the admin role ---
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Please login to continue." }, 401);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const caller = userData?.user;
  if (userErr || !caller) return json({ error: "Please login to continue." }, 401);
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", caller.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) return json({ error: "You do not have permission to perform this action." }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const action = String(body.action ?? "");

  try {
    if (action === "create_user") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const role = String(body.role ?? "student");
      const fullName = String(body.full_name ?? "").trim();
      const username = String(body.username ?? "").trim().toLowerCase();
      const mobileRaw = String(body.mobile_number ?? "").trim();
      const mobile = mobileRaw ? normalizeMobile(mobileRaw) : null;

      if (!email.includes("@") || password.length < 6) {
        return json({ error: "A valid email and a password of at least 6 characters are required." }, 400);
      }
      if (!["student", "trainer", "admin"].includes(role)) {
        return json({ error: "Invalid role." }, 400);
      }
      if (mobileRaw && !mobile) return json({ error: "Enter a valid 10-digit Indian mobile number." }, 400);

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: fullName || email.split("@")[0], username, mobile_number: mobile },
      });
      if (createErr || !created.user) {
        return json({ error: createErr?.message ?? "Could not create the account." }, 400);
      }

      const { error: profErr } = await admin
        .from("profiles")
        .update({
          display_name: fullName || null,
          username: username || null,
          mobile_number: mobile,
        })
        .eq("id", created.user.id);
      if (profErr) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: "Username or mobile number is already in use." }, 400);
      }

      await admin.from("user_roles").insert({ user_id: created.user.id, role });
      return json({ ok: true, user_id: created.user.id });
    }

    if (action === "set_role") {
      const userId = String(body.user_id ?? "");
      const role = String(body.role ?? "");
      if (!userId) return json({ error: "Invalid request." }, 400);
      if (!["student", "trainer", "admin", "none"].includes(role)) {
        return json({ error: "Invalid role." }, 400);
      }
      if (userId === caller.id && role !== "admin") {
        return json({ error: "You cannot remove your own admin role." }, 400);
      }
      await admin.from("user_roles").delete().eq("user_id", userId).in("role", ["student", "trainer", "admin"]);
      if (role !== "none") await admin.from("user_roles").insert({ user_id: userId, role });
      return json({ ok: true });
    }

    if (action === "set_status") {
      const userId = String(body.user_id ?? "");
      const status = String(body.status ?? "");
      if (!userId || !["active", "disabled"].includes(status)) {
        return json({ error: "Invalid request." }, 400);
      }
      if (userId === caller.id) return json({ error: "You cannot disable your own account." }, 400);
      await admin.from("profiles").update({ status }).eq("id", userId);
      return json({ ok: true });
    }

    if (action === "set_password") {
      const userId = String(body.user_id ?? "");
      const password = String(body.password ?? "");
      if (!userId || password.length < 6) return json({ error: "Password must be at least 6 characters." }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: "Could not update the password." }, 400);
      return json({ ok: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (_e) {
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
