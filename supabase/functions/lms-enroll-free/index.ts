import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Enrols the signed-in user into a free, published course. Paid courses must go through payment. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Please login to continue." }, 401);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userErr || !user) return json({ error: "Please login to continue." }, 401);

  const { data: prof } = await admin.from("profiles").select("status").eq("id", user.id).maybeSingle();
  if (prof?.status === "disabled") {
    return json({ error: "Your account has been disabled. Please contact the administrator." }, 403);
  }

  let body: { course_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const courseId = typeof body.course_id === "string" ? body.course_id : "";
  if (!/^[0-9a-f-]{36}$/i.test(courseId)) return json({ error: "Invalid course." }, 400);

  const { data: course } = await admin
    .from("courses")
    .select("id, price_inr, is_published")
    .eq("id", courseId)
    .maybeSingle();
  if (!course || !course.is_published) return json({ error: "Course not available." }, 404);
  if ((course.price_inr ?? 0) > 0) {
    return json({ error: "This course requires payment before enrolment." }, 402);
  }

  const { data: existing } = await admin
    .from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("student_id", user.id)
    .maybeSingle();
  if (!existing) {
    const { error } = await admin.from("enrollments").insert({ course_id: courseId, student_id: user.id });
    if (error) return json({ error: "Could not enrol. Please try again." }, 400);
    await admin.from("user_roles").upsert(
      { user_id: user.id, role: "student" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
  }
  return json({ ok: true });
});
