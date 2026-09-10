import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLmsAuth } from "@/hooks/useLmsAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { certificatePreviewUrl } from "@/lib/certificate";
import { Plus, Award, ShieldCheck, History, Eye, CheckCircle2, XCircle, Mail, MessageCircle } from "lucide-react";

type Course = { id: string; slug: string; title: string; category: string; level: string; is_published: boolean; duration_hours: number; price_inr: number };
type Submission = { id: string; answer_text: string | null; score: number | null; student_id: string; assignment_id: string };
type Student = { id: string; display_name: string | null; email: string | null; phone: string | null };
export type Cert = {
  id: string;
  certificate_no: string;
  course_title: string | null;
  student_name: string | null;
  student_id: string;
  student_email: string | null;
  student_phone: string | null;
  issued_at: string;
  status: string;
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const CERT_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  approved: "default",
  pending: "secondary",
  rejected: "destructive",
};

export default function LmsManage() {
  const nav = useNavigate();
  const { user, loading, isAdmin, canManage } = useLmsAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [counts, setCounts] = useState<{ modules: Record<string, number>; lessons: Record<string, number>; students: Record<string, number> }>({ modules: {}, lessons: {}, students: {} });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [sel, setSel] = useState<Course | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [preview, setPreview] = useState<Cert | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [retake, setRetake] = useState(3);

  const [c, setC] = useState({ title: "", category: "Cyber Security", level: "Beginner", duration_hours: 40, price_inr: 0, summary: "", description: "" });
  const [l, setL] = useState({ title: "", video_url: "", content: "", duration_minutes: 30 });
  const [a, setA] = useState({ title: "", instructions: "", max_score: 100 });
  const [q, setQ] = useState({ title: "Final assessment", pass_percent: 60, question: "", o1: "", o2: "", o3: "", o4: "", correct: 1 });
  const [roleEmail, setRoleEmail] = useState("");

  useEffect(() => {
    if (!loading && !user) nav("/lms/auth", { replace: true });
  }, [loading, user, nav]);

  const loadCerts = useCallback(async (courseId: string) => {
    const { data } = await supabase
      .from("certificates")
      .select("id,certificate_no,course_title,student_name,student_id,student_email,student_phone,issued_at,status")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });
    setCerts((data ?? []) as Cert[]);
  }, []);

  const loadCourses = useCallback(async () => {
    const [{ data }, { data: mods }, { data: ls }, { data: enr }] = await Promise.all([
      supabase.from("courses").select("id,slug,title,category,level,is_published,duration_hours,price_inr").order("created_at", { ascending: false }),
      supabase.from("course_modules").select("course_id"),
      supabase.from("lessons").select("course_id"),
      supabase.from("enrollments").select("course_id"),
    ]);
    setCourses((data ?? []) as Course[]);
    const tally = (rows: { course_id: string }[] | null) =>
      (rows ?? []).reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.course_id]: (acc[r.course_id] ?? 0) + 1 }), {});
    setCounts({ modules: tally(mods), lessons: tally(ls), students: tally(enr) });
  }, []);

  useEffect(() => {
    if (canManage) loadCourses();
  }, [canManage, loadCourses]);

  useEffect(() => {
    if (!sel) return;
    supabase.from("assignment_submissions").select("id,answer_text,score,student_id,assignment_id").eq("course_id", sel.id).then(({ data }) => setSubs((data ?? []) as Submission[]));
    supabase.from("enrollments").select("student_id, profiles:student_id(id,display_name,email,phone)").eq("course_id", sel.id).then(({ data }) => {
      const rows = (data ?? []) as unknown as { profiles: Student | null }[];
      setStudents(rows.map((r) => r.profiles).filter(Boolean) as Student[]);
    });
    supabase.from("quizzes").select("retake_limit").eq("course_id", sel.id).limit(1).maybeSingle().then(({ data }) => setRetake(data?.retake_limit ?? 3));
    loadCerts(sel.id);
  }, [sel, loadCerts]);


  if (!loading && user && !canManage) {
    return (
      <section className="section-py container mx-auto container-px">
        <Card className="p-6">
          <h1 className="font-display text-xl font-bold text-primary">Trainer access required</h1>
          <p className="text-sm text-muted-foreground mt-2">Ask an administrator to grant you the trainer role. <Link to="/lms" className="text-accent underline">Back to My Learning</Link></p>
        </Card>
      </section>
    );
  }

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("courses").insert({ ...c, slug: slugify(c.title), trainer_id: user!.id });
    if (error) return toast({ title: "Could not create course", description: error.message, variant: "destructive" });
    setC({ ...c, title: "", summary: "", description: "" });
    toast({ title: "Course created", description: "Add lessons, then publish it." });
    loadCourses();
  }

  async function togglePublish(course: Course) {
    const { error } = await supabase.from("courses").update({ is_published: !course.is_published }).eq("id", course.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    loadCourses();
  }

  async function addLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!sel) return;
    const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("course_id", sel.id);
    const { error } = await supabase.from("lessons").insert({ ...l, course_id: sel.id, position: (count ?? 0) + 1 });
    if (error) return toast({ title: "Could not add lesson", description: error.message, variant: "destructive" });
    setL({ title: "", video_url: "", content: "", duration_minutes: 30 });
    toast({ title: "Lesson added" });
  }

  async function addAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!sel) return;
    const { error } = await supabase.from("assignments").insert({ ...a, course_id: sel.id });
    if (error) return toast({ title: "Could not add assignment", description: error.message, variant: "destructive" });
    setA({ title: "", instructions: "", max_score: 100 });
    toast({ title: "Assignment added" });
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!sel) return;
    let { data: quiz } = await supabase.from("quizzes").select("id").eq("course_id", sel.id).limit(1).maybeSingle();
    if (!quiz) {
      const { data, error } = await supabase.from("quizzes").insert({ course_id: sel.id, title: q.title, pass_percent: q.pass_percent }).select("id").single();
      if (error) return toast({ title: "Could not create quiz", description: error.message, variant: "destructive" });
      quiz = data;
    }
    const { count } = await supabase.from("quiz_questions").select("id", { count: "exact", head: true }).eq("quiz_id", quiz!.id);
    const { error } = await supabase.from("quiz_questions").insert({
      quiz_id: quiz!.id,
      course_id: sel.id,
      question: q.question,
      options: [q.o1, q.o2, q.o3, q.o4].filter(Boolean),
      correct_index: q.correct - 1,
      position: (count ?? 0) + 1,
    });
    if (error) return toast({ title: "Could not add question", description: error.message, variant: "destructive" });
    setQ({ ...q, question: "", o1: "", o2: "", o3: "", o4: "", correct: 1 });
    toast({ title: "Question added" });
  }

  async function grade(s: Submission, score: number) {
    const { error } = await supabase.from("assignment_submissions").update({ score, graded_at: new Date().toISOString(), graded_by: user!.id }).eq("id", s.id);
    if (error) return toast({ title: "Grading failed", description: error.message, variant: "destructive" });
    setSubs((prev) => prev.map((p) => (p.id === s.id ? { ...p, score } : p)));
    toast({ title: "Graded" });
  }

  async function saveRetakeLimit() {
    if (!sel) return;
    const { error } = await supabase.from("quizzes").update({ retake_limit: retake }).eq("course_id", sel.id);
    if (error) return toast({ title: "Could not save retake limit", description: error.message, variant: "destructive" });
    toast({ title: "Retake limit saved", description: retake === 0 ? "Unlimited attempts allowed." : `${retake} attempts per student.` });
  }





  /** Creates the certificate in PENDING state — an admin must preview and approve it. */
  async function issueCertificate(student: { id: string; display_name: string | null; email: string | null; phone: string | null }) {
    if (!sel) return;
    const { data, error } = await supabase
      .from("certificates")
      .insert({
        course_id: sel.id,
        student_id: student.id,
        student_name: student.display_name,
        student_email: student.email,
        student_phone: student.phone,
        course_title: sel.title,
        issued_by: user!.id,
        status: "pending",
        certificate_no: `SSTS-${sel.slug.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`,
      })
      .select("id,certificate_no,course_title,student_name,student_id,student_email,student_phone,issued_at,status")
      .single();
    if (error) return toast({ title: "Could not create certificate", description: error.message, variant: "destructive" });
    await loadCerts(sel.id);
    setPreview(data as Cert);
    toast({ title: "Draft certificate created", description: "Preview it, then approve to release the download." });
  }

  /** Approves the certificate (students can then download it) and fires email + WhatsApp notifications. */
  async function approveCertificate(c: Cert) {
    if (!isAdmin) return toast({ title: "Admin approval required", description: "Only an administrator can approve certificates.", variant: "destructive" });
    setNotifying(true);
    const { error } = await supabase
      .from("certificates")
      .update({ status: "approved", approved_by: user!.id, approved_at: new Date().toISOString() })
      .eq("id", c.id);
    if (error) {
      setNotifying(false);
      return toast({ title: "Approval failed", description: error.message, variant: "destructive" });
    }
    const { data, error: fnErr } = await supabase.functions.invoke("certificate-notify", { body: { certificate_id: c.id } });
    setNotifying(false);
    if (sel) await loadCerts(sel.id);
    setPreview(null);
    if (fnErr) {
      return toast({ title: "Approved, but notifications failed", description: fnErr.message, variant: "destructive" });
    }
    const r = (data ?? {}) as { results?: Record<string, string>; whatsapp_link?: string | null };
    if (r.whatsapp_link && r.results?.whatsapp !== "sent") window.open(r.whatsapp_link, "_blank", "noopener");
    toast({
      title: "Certificate approved",
      description: `Email: ${r.results?.email ?? "—"} · WhatsApp: ${r.results?.whatsapp ?? "—"}. The student can now download the PDF.`,
    });
  }

  async function rejectCertificate(c: Cert) {
    const { error } = await supabase.from("certificates").update({ status: "rejected" }).eq("id", c.id);
    if (error) return toast({ title: "Could not reject", description: error.message, variant: "destructive" });
    if (sel) await loadCerts(sel.id);
    setPreview(null);
    toast({ title: "Certificate rejected" });
  }


  async function grantRole(role: "trainer" | "admin") {
    const { data: p } = await supabase.from("profiles").select("id").eq("email", roleEmail.trim()).maybeSingle();
    if (!p) return toast({ title: "User not found", description: "They must sign up first.", variant: "destructive" });
    const { error } = await supabase.from("user_roles").insert({ user_id: p.id, role });
    if (error) return toast({ title: "Could not grant role", description: error.message, variant: "destructive" });
    setRoleEmail("");
    toast({ title: `${role} role granted` });
  }

  return (
    <>
      <Seo title="LMS Management — SS TECH SERVICES" description="Trainer and administrator tools for the SS TECH SERVICES Training Academy LMS." path="/lms/manage" noindex />
      <section className="section-py container mx-auto container-px">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <h1 className="font-display text-3xl font-bold text-primary">LMS Management</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/lms/activity"><History className="mr-2 h-4 w-4" /> Activity log</Link></Button>
            <Button asChild variant="outline"><Link to="/lms">My Learning</Link></Button>
          </div>
        </div>

        <Tabs defaultValue="courses">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="content">Lessons & tasks</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>

            {isAdmin && <TabsTrigger value="roles">Roles</TabsTrigger>}
          </TabsList>

          <TabsContent value="courses" className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-primary mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-accent" /> New course</h2>
              <form className="grid gap-3" onSubmit={createCourse}>
                <div><Label htmlFor="c-title">Title</Label><Input id="c-title" required value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="c-cat">Category</Label><Input id="c-cat" required value={c.category} onChange={(e) => setC({ ...c, category: e.target.value })} /></div>
                  <div><Label htmlFor="c-lvl">Level</Label><Input id="c-lvl" required value={c.level} onChange={(e) => setC({ ...c, level: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="c-hrs">Duration (hours)</Label><Input id="c-hrs" type="number" min={1} value={c.duration_hours} onChange={(e) => setC({ ...c, duration_hours: Number(e.target.value) })} /></div>
                  <div><Label htmlFor="c-price">Fee (INR)</Label><Input id="c-price" type="number" min={0} value={c.price_inr} onChange={(e) => setC({ ...c, price_inr: Number(e.target.value) })} /></div>
                </div>
                <div><Label htmlFor="c-sum">Summary</Label><Input id="c-sum" value={c.summary} onChange={(e) => setC({ ...c, summary: e.target.value })} /></div>
                <div><Label htmlFor="c-desc">Description</Label><Textarea id="c-desc" value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} /></div>
                <Button className="bg-gradient-accent border-0">Create course</Button>
              </form>
            </Card>
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-primary mb-4">All courses</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <Input
                  className="max-w-xs"
                  aria-label="Search courses"
                  placeholder="Search by title or category…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex gap-1">
                  {(["all", "published", "draft"] as const).map((s) => (
                    <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} className="capitalize" onClick={() => setStatusFilter(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
              <ul className="space-y-3">
                {courses
                  .filter((course) => {
                    const q = search.trim().toLowerCase();
                    const matches = !q || course.title.toLowerCase().includes(q) || course.category.toLowerCase().includes(q);
                    const status = statusFilter === "all" || (statusFilter === "published" ? course.is_published : !course.is_published);
                    return matches && status;
                  })
                  .map((course) => (
                    <li key={course.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
                      <div>
                        <button className={`text-left font-semibold ${sel?.id === course.id ? "text-accent" : "text-primary"}`} onClick={() => setSel(course)}>{course.title}</button>
                        <p className="text-xs text-muted-foreground">
                          {course.category} · {course.level} · {counts.modules[course.id] ?? 0} modules · {counts.lessons[course.id] ?? 0} lessons · {counts.students[course.id] ?? 0} students
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline"><Link to={`/lms/manage/course/${course.id}`}>Manage content</Link></Button>
                        <Badge variant={course.is_published ? "default" : "outline"}>{course.is_published ? "Published" : "Draft"}</Badge>
                        <Switch checked={course.is_published} onCheckedChange={() => togglePublish(course)} aria-label={`Publish ${course.title}`} />
                      </div>
                    </li>
                  ))}
                {courses.length === 0 && <li className="text-sm text-muted-foreground">No courses yet.</li>}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            {!sel ? (
              <p className="text-sm text-muted-foreground">Select a course in the Courses tab first.</p>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="p-6">
                  <h2 className="font-display text-lg font-bold text-primary mb-1">Add lesson</h2>
                  <p className="text-xs text-muted-foreground mb-4">{sel.title}</p>
                  <form className="grid gap-3" onSubmit={addLesson}>
                    <div><Label htmlFor="l-title">Lesson title</Label><Input id="l-title" required value={l.title} onChange={(e) => setL({ ...l, title: e.target.value })} /></div>
                    <div><Label htmlFor="l-video">Video embed URL</Label><Input id="l-video" placeholder="https://www.youtube.com/embed/…" value={l.video_url} onChange={(e) => setL({ ...l, video_url: e.target.value })} /></div>
                    <div><Label htmlFor="l-min">Minutes</Label><Input id="l-min" type="number" min={1} value={l.duration_minutes} onChange={(e) => setL({ ...l, duration_minutes: Number(e.target.value) })} /></div>
                    <div><Label htmlFor="l-content">Notes</Label><Textarea id="l-content" value={l.content} onChange={(e) => setL({ ...l, content: e.target.value })} /></div>
                    <Button className="bg-gradient-accent border-0">Add lesson</Button>
                  </form>
                </Card>
                <Card className="p-6">
                  <h2 className="font-display text-lg font-bold text-primary mb-4">Add assignment</h2>
                  <form className="grid gap-3" onSubmit={addAssignment}>
                    <div><Label htmlFor="a-title">Title</Label><Input id="a-title" required value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} /></div>
                    <div><Label htmlFor="a-inst">Instructions</Label><Textarea id="a-inst" value={a.instructions} onChange={(e) => setA({ ...a, instructions: e.target.value })} /></div>
                    <div><Label htmlFor="a-max">Max score</Label><Input id="a-max" type="number" min={1} value={a.max_score} onChange={(e) => setA({ ...a, max_score: Number(e.target.value) })} /></div>
                    <Button className="bg-gradient-accent border-0">Add assignment</Button>
                  </form>
                </Card>
                <Card className="p-6">
                  <h2 className="font-display text-lg font-bold text-primary mb-4">Add quiz question</h2>
                  <form className="grid gap-3" onSubmit={addQuestion}>
                    <div><Label htmlFor="q-q">Question</Label><Input id="q-q" required value={q.question} onChange={(e) => setQ({ ...q, question: e.target.value })} /></div>
                    {(["o1", "o2", "o3", "o4"] as const).map((k, i) => (
                      <div key={k}>
                        <Label htmlFor={`q-${k}`}>Option {i + 1}</Label>
                        <Input id={`q-${k}`} required={i < 2} value={q[k]} onChange={(e) => setQ({ ...q, [k]: e.target.value })} />
                      </div>
                    ))}
                    <div><Label htmlFor="q-correct">Correct option (1-4)</Label><Input id="q-correct" type="number" min={1} max={4} value={q.correct} onChange={(e) => setQ({ ...q, correct: Number(e.target.value) })} /></div>
                    <div><Label htmlFor="q-pass">Pass %</Label><Input id="q-pass" type="number" min={1} max={100} value={q.pass_percent} onChange={(e) => setQ({ ...q, pass_percent: Number(e.target.value) })} /></div>
                    <Button className="bg-gradient-accent border-0">Add question</Button>
                  </form>
                  <div className="mt-6 border-t border-border pt-4">
                    <Label htmlFor="q-retake">Retake limit for this course (0 = unlimited)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input id="q-retake" type="number" min={0} max={20} value={retake} onChange={(e) => setRetake(Number(e.target.value))} />
                      <Button type="button" variant="outline" onClick={saveRetakeLimit}>Save</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Students see remaining attempts and full attempt history on the course page.</p>
                  </div>
                </Card>

              </div>
            )}
          </TabsContent>

          <TabsContent value="students">
            {!sel ? (
              <p className="text-sm text-muted-foreground">Select a course in the Courses tab first.</p>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h2 className="font-display text-lg font-bold text-primary mb-4">Enrolled students — {sel.title}</h2>
                  <ul className="space-y-3">
                    {students.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
                        <div>
                          <p className="font-medium text-primary text-sm">{s.display_name ?? "Student"}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => issueCertificate(s)}>
                          <Award className="mr-1 h-4 w-4" /> Issue certificate
                        </Button>

                      </li>
                    ))}
                    {students.length === 0 && <li className="text-sm text-muted-foreground">No enrolments yet.</li>}
                  </ul>
                </Card>
                <Card className="p-6">
                  <h2 className="font-display text-lg font-bold text-primary mb-4">Assignment submissions</h2>
                  <ul className="space-y-4">
                    {subs.map((s) => (
                      <li key={s.id} className="border-b border-border pb-4 last:border-0">
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{s.answer_text}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Label htmlFor={`sc-${s.id}`} className="text-xs">Score</Label>
                          <Input id={`sc-${s.id}`} type="number" className="w-24 h-9" defaultValue={s.score ?? 0} onBlur={(e) => grade(s, Number(e.target.value))} />
                          {s.score !== null && <Badge variant="secondary">Graded {s.score}</Badge>}
                        </div>
                      </li>
                    ))}
                    {subs.length === 0 && <li className="text-sm text-muted-foreground">No submissions yet.</li>}
                  </ul>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="certificates">
            {!sel ? (
              <p className="text-sm text-muted-foreground">Select a course in the Courses tab first.</p>
            ) : (
              <Card className="p-6">
                <h2 className="font-display text-lg font-bold text-primary mb-1 flex items-center gap-2"><Award className="h-5 w-5 text-accent" /> Certificates — {sel.title}</h2>
                <p className="text-xs text-muted-foreground mb-4">Preview each certificate, then approve it to release the student download and send email + WhatsApp alerts.</p>
                <ul className="space-y-3">
                  {certs.map((ct) => (
                    <li key={ct.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-primary text-sm">{ct.student_name ?? "Student"} · {ct.certificate_no}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-3">
                          <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{ct.student_email ?? "no email"}</span>
                          <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{ct.student_phone ?? "no phone"}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={CERT_BADGE[ct.status] ?? "outline"}>{ct.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => setPreview(ct)}><Eye className="mr-1 h-4 w-4" /> Preview</Button>
                        {isAdmin && ct.status !== "approved" && (
                          <Button size="sm" className="bg-gradient-accent border-0" disabled={notifying} onClick={() => approveCertificate(ct)}>
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve & notify
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                  {certs.length === 0 && <li className="text-sm text-muted-foreground">No certificates for this course yet.</li>}
                </ul>
              </Card>
            )}
          </TabsContent>



          {isAdmin && (
            <TabsContent value="roles">
              <Card className="p-6 max-w-lg">
                <h2 className="font-display text-lg font-bold text-primary mb-1 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent" /> Grant roles</h2>
                <p className="text-xs text-muted-foreground mb-4">The user must have signed up already.</p>
                <Label htmlFor="role-email">User email</Label>
                <Input id="role-email" type="email" value={roleEmail} onChange={(e) => setRoleEmail(e.target.value)} />
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => grantRole("trainer")} className="bg-gradient-accent border-0">Make trainer</Button>
                  <Button onClick={() => grantRole("admin")} variant="outline">Make admin</Button>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </section>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-display">Certificate preview — {preview?.certificate_no}</DialogTitle>
            <DialogDescription>
              {preview?.student_name ?? "Student"} · {preview?.course_title} · status: {preview?.status}
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <iframe
              title="Certificate preview"
              src={certificatePreviewUrl({
                certificate_no: preview.certificate_no,
                student_name: preview.student_name,
                course_title: preview.course_title,
                issued_at: preview.issued_at,
              })}
              className="w-full h-[420px] rounded-md border border-border bg-muted"
            />
          )}
          <DialogFooter className="gap-2">
            {isAdmin && preview?.status !== "approved" && (
              <>
                <Button variant="outline" onClick={() => preview && rejectCertificate(preview)}><XCircle className="mr-1 h-4 w-4" /> Reject</Button>
                <Button className="bg-gradient-accent border-0" disabled={notifying} onClick={() => preview && approveCertificate(preview)}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> {notifying ? "Approving…" : "Approve & notify student"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>

  );
}