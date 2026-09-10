import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const INVALID = { error: "Invalid login credentials." };

function normalizeMobile(raw: string): string | null {
  const d = raw.replace(/[^0-9]/g, "");
  if (d.length === 10) return `+91${d}`;
  if (d.length === 12 && d.startsWith("91")) return `+${d}`;
  if (d.length === 11 && d.startsWith("0")) return `+91${d.slice(1)}`;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { identifier?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!identifier || identifier.length > 255 || !password) return json(INVALID, 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Resolve the login identifier to an account email, server-side only.
  let email: string | null = null;
  let status = "active";

  if (identifier.includes("@")) {
    email = identifier.toLowerCase();
    const { data } = await admin
      .from("profiles")
      .select("status")
      .ilike("email", email)
      .maybeSingle();
    if (data?.status) status = data.status;
  } else {
    const mobile = /^[0-9+\-\s()]+$/.test(identifier) ? normalizeMobile(identifier) : null;
    const query = admin.from("profiles").select("email, status");
    const { data } = mobile
      ? await query.eq("mobile_number", mobile).maybeSingle()
      : await query.eq("username", identifier.toLowerCase()).maybeSingle();
    if (!data?.email) return json(INVALID, 400);
    email = data.email as string;
    status = (data.status as string) ?? "active";
  }

  if (status === "disabled") {
    return json({ error: "Your account has been disabled. Please contact the administrator." }, 403);
  }

  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false },
  });
  const { data: signIn, error } = await anon.auth.signInWithPassword({ email: email!, password });
  if (error || !signIn.session) return json(INVALID, 400);

  return json({
    access_token: signIn.session.access_token,
    refresh_token: signIn.session.refresh_token,
  });
});
