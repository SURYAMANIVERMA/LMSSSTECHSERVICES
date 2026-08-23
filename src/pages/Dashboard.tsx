import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Award, BookOpen, CheckCircle2, LogOut, PlayCircle } from "lucide-react";
import { lmsSupabase } from "@/integrations/supabase/lmsClient";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [certificates, setCertificates] = useState<any[]>([]);
  const nav = useNavigate();

  async function load() {
    const { data: { user: current } } = await lmsSupabase.auth.getUser();
    if (!current) { nav("/lms"); return; }
    setUser(current);
    const { data: roles } = await lmsSupabase.from("user_roles").select("role").eq("user_id", current.id);
    if (roles?.[0]?.role !== "student") { nav("/lms"); return; }
    const { data: rows } = await lmsSupabase.from("lms_enrollments").select("*, lms_courses(*)").eq("student_id", current.id).order("enrolled_at", { ascending: false });
    const list = rows || [];
    setEnrollments(list);
    const values: Record<string, number> = {};
    for (const row of list) {
      const { data } = await lmsSupabase.rpc("get_course_progress", { p_course_id: row.course_id, p_student_id: current.id });
      values[row.course_id] = Number(data || 0);
    }
    setProgress(values);
    const { data: certs } = await lmsSupabase.from("lms_certificates").select("*, lms_courses(title)").eq("student_id", current.id).order("issued_at", { ascending: false });
    setCertificates(certs || []);
  }

  useEffect(() => { load(); }, []);
  const overall = useMemo(() => enrollments.length ? Math.round(Object.values(progress).reduce((a,b) => a+b, 0) / enrollments.length) : 0, [enrollments, progress]);

  async function completeLesson(courseId: string) {
    const { data: modules } = await lmsSupabase.from("lms_modules").select("id").eq("course_id", courseId);
    const moduleIds = (modules || []).map((m: any) => m.id);
    if (!moduleIds.length) { toast({ title: "Course content is being prepared" }); return; }
    const { data: lessons } = await lmsSupabase.from("lms_lessons").select("id").in("module_id", moduleIds).order("position").limit(1);
    const lesson = lessons?.[0];
    if (!lesson || !user) { toast({ title: "No lesson found yet" }); return; }
    const { error } = await lmsSupabase.from("lms_lesson_progress").upsert({ student_id: user.id, lesson_id: lesson.id, completed: true, progress_percent: 100 }, { onConflict: "student_id,lesson_id" });
    if (error) toast({ title: "Could not save progress", description: error.message, variant: "destructive" });
    else { toast({ title: "Progress saved" }); await load(); }
  }

  async function getCertificate(courseId: string) {
    const { data, error } = await lmsSupabase.rpc("issue_course_certificate", { p_course_id: courseId });
    if (error) toast({ title: "Certificate unavailable", description: error.message, variant: "destructive" });
    else { toast({ title: "Certificate issued", description: data?.certificate_no }); await load(); }
  }

  async function signOut() { await lmsSupabase.auth.signOut(); nav("/lms"); }

  return <div className="container mx-auto container-px py-10">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"><div><p className="text-sm text-accent font-semibold">STUDENT DASHBOARD</p><h1 className="text-3xl font-bold text-primary">Welcome back</h1><p className="text-muted-foreground">{user?.email}</p></div><Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2"/>Sign out</Button></div>
    <div className="grid md:grid-cols-3 gap-5 mb-8"><Card className="p-5"><BookOpen className="h-7 w-7 text-accent mb-2"/><p className="text-sm text-muted-foreground">Enrolled Courses</p><p className="text-3xl font-bold">{enrollments.length}</p></Card><Card className="p-5"><PlayCircle className="h-7 w-7 text-accent mb-2"/><p className="text-sm text-muted-foreground">Overall Progress</p><Progress value={overall} className="mt-3"/><p className="text-sm mt-2">{overall}%</p></Card><Card className="p-5"><Award className="h-7 w-7 text-accent mb-2"/><p className="text-sm text-muted-foreground">Certificates</p><p className="text-3xl font-bold">{certificates.length}</p></Card></div>
    <div className="grid lg:grid-cols-3 gap-5">
      <section className="lg:col-span-2 space-y-5"><h2 className="text-2xl font-bold text-primary">My Learning</h2>{enrollments.length === 0 ? <Card className="p-8 text-center"><p className="text-muted-foreground">You have no enrollments yet.</p><Button className="mt-4" onClick={() => nav("/lms")}>Browse Courses</Button></Card> : enrollments.map(e => { const p = progress[e.course_id] || 0; return <Card key={e.id} className="p-6"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"><div><Badge>{e.lms_courses?.category}</Badge><h3 className="text-xl font-bold text-primary mt-2">{e.lms_courses?.title}</h3><p className="text-sm text-muted-foreground">{e.lms_courses?.level} · {e.lms_courses?.duration_hours} hours</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => completeLesson(e.course_id)}><CheckCircle2 className="h-4 w-4 mr-1"/>Mark lesson</Button><Button size="sm" onClick={() => getCertificate(e.course_id)} disabled={p < 100}>Certificate</Button></div></div><Progress value={p} className="mt-5"/><p className="text-xs text-muted-foreground mt-2">{p}% complete</p></Card> })}</section>
      <aside><h2 className="text-2xl font-bold text-primary mb-5">My Certificates</h2><div className="space-y-4">{certificates.length ? certificates.map(c => <Card key={c.id} className="p-5"><Award className="h-7 w-7 text-accent"/><h3 className="font-semibold mt-2">{c.lms_courses?.title}</h3><p className="text-xs text-muted-foreground mt-1">{c.certificate_no}</p><p className="text-xs text-muted-foreground">{new Date(c.issued_at).toLocaleDateString()}</p></Card>) : <Card className="p-5"><p className="text-sm text-muted-foreground">Complete all lessons in a course to unlock a certificate.</p></Card>}</div></aside>
    </div>
  </div>;
}
