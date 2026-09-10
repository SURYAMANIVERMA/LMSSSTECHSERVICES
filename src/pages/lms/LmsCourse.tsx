import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLmsAuth } from "@/hooks/useLmsAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import {
  CheckCircle2, Circle, PlayCircle, FileText, ListChecks, History, ChevronLeft, ChevronRight,
  Layers, BookOpen, Lock, Loader2, AlertTriangle,
} from "lucide-react";

type Course = {
  id: string; slug: string; title: string; category: string; level: string; summary: string | null;
  description: string | null; duration_hours: number; instructor: string | null; status: string; is_published: boolean;
};
type Module = { id: string; title: string; description: string | null; sort_order: number };
type Lesson = {
  id: string; module_id: string | null; title: string; description: string | null; lesson_type: string;
  video_url: string | null; pdf_url: string | null; content: string | null; position: number;
  duration_minutes: number; is_free: boolean;
};
type Assignment = { id: string; title: string; instructions: string | null; due_at: string | null; max_score: number };
type Quiz = { id: string; title: string; description: string | null; pass_percent: number; retake_limit: number };
type Question = { id: string; question: string; options: unknown; position: number; explanation: string | null; marks: number };
type Attempt = { id: string; attempt_number: number; score_percent: number; passed: boolean; created_at: string };

const TYPE_ICON: Record<string, typeof PlayCircle> = { video: PlayCircle, pdf: FileText, text: BookOpen, quiz: ListChecks };

export default function LmsCourse() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { user } = useLmsAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  // ---------- course + structure ----------
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      const { data: c, error } = await supabase
        .from("courses")
        .select("id,slug,title,category,level,summary,description,duration_hours,instructor,status,is_published")
        .eq("slug", slug)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        setLoading(false);
        return;
      }
      setCourse(c as Course | null);
      if (!c) {
        setLoading(false);
        return;
      }
      const [{ data: mods, error: mErr }, { data: ls, error: lErr }, { data: outline }] = await Promise.all([
        supabase.from("course_modules").select("id,title,description,sort_order").eq("course_id", c.id).order("sort_order"),
        supabase
          .from("lessons")
          .select("id,module_id,title,description,lesson_type,video_url,pdf_url,content,position,duration_minutes,is_free")
          .eq("course_id", c.id)
          .order("position"),
        // Outline (titles only, no paid content) so non-enrolled visitors still see the curriculum
        supabase.rpc("get_course_outline", { p_course_id: c.id }),
      ]);
      if (cancelled) return;
      if (mErr || lErr) setLoadError(mErr?.message ?? lErr?.message ?? null);
      setModules((mods ?? []) as Module[]);
      const readable = new Map((ls ?? []).map((l) => [l.id, l as Lesson]));
      const merged = (outline ?? []).map((o) => ({
        ...(o as unknown as Lesson),
        video_url: readable.get(o.id)?.video_url ?? null,
        pdf_url: readable.get(o.id)?.pdf_url ?? null,
        content: readable.get(o.id)?.content ?? null,
      })) as Lesson[];
      setLessons(merged.length ? merged : ((ls ?? []) as Lesson[]));

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const loadAttempts = useCallback(async (quizId: string, uid: string) => {
    const { data } = await supabase
      .from("quiz_attempts")
      .select("id,attempt_number,score_percent,passed,created_at")
      .eq("quiz_id", quizId)
      .eq("student_id", uid)
      .order("attempt_number", { ascending: false });
    setAttempts((data ?? []) as Attempt[]);
  }, []);

  const loadStudentData = useCallback(async (courseId: string, uid: string) => {
    const [{ data: enr }, { data: prog }, { data: asg }, { data: qz }] = await Promise.all([
      supabase.from("enrollments").select("id").eq("course_id", courseId).eq("student_id", uid).maybeSingle(),
      supabase.from("lesson_progress").select("lesson_id,completed,last_accessed_at").eq("course_id", courseId).eq("student_id", uid),
      supabase.from("assignments").select("id,title,instructions,due_at,max_score").eq("course_id", courseId),
      supabase.from("quizzes").select("id,title,description,pass_percent,retake_limit").eq("course_id", courseId).limit(1),
    ]);
    setEnrolled(!!enr);
    setDone((prog ?? []).filter((p) => p.completed).map((p) => p.lesson_id));
    setAssignments((asg ?? []) as Assignment[]);
    const q = (qz ?? [])[0] as Quiz | undefined;
    setQuiz(q ?? null);
    if (q) {
      // Questions come from a server function that never returns the answer key
      const { data: qq } = await supabase.rpc("get_quiz_questions_for_attempt", { p_quiz_id: q.id });
      setQuestions((qq ?? []) as Question[]);
      loadAttempts(q.id, uid);

    } else {
      setQuestions([]);
      setAttempts([]);
    }
    // resume where the student left off
    const last = (prog ?? [])
      .filter((p) => p.last_accessed_at)
      .sort((a, b) => (a.last_accessed_at! < b.last_accessed_at! ? 1 : -1))[0];
    if (last) setActiveId((cur) => cur ?? last.lesson_id);
  }, [loadAttempts]);

  useEffect(() => {
    if (course && user) loadStudentData(course.id, user.id);
    if (!user) { setEnrolled(false); setDone([]); }
  }, [course, user, loadStudentData]);

  // ---------- ordered lesson list grouped by module ----------
  const grouped = useMemo(() => {
    const byModule = modules.map((m) => ({
      module: m,
      lessons: lessons.filter((l) => l.module_id === m.id).sort((a, b) => a.position - b.position),
    }));
    const loose = lessons.filter((l) => !l.module_id).sort((a, b) => a.position - b.position);
    if (loose.length) byModule.push({ module: { id: "__none", title: "Course lessons", description: null, sort_order: 999 }, lessons: loose });
    return byModule;
  }, [modules, lessons]);

  const flat = useMemo(() => grouped.flatMap((g) => g.lessons), [grouped]);
  useEffect(() => { if (!activeId && flat.length) setActiveId(flat[0].id); }, [flat, activeId]);

  const active = flat.find((l) => l.id === activeId) ?? null;
  const activeIdx = active ? flat.findIndex((l) => l.id === active.id) : -1;
  const total = flat.length;
  const completed = done.filter((id) => flat.some((l) => l.id === id)).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  // ---------- actions ----------
  async function openLesson(l: Lesson) {
    setActiveId(l.id);
    if (!user || !course || !enrolled) return;
    await supabase.from("lesson_progress").upsert(
      { lesson_id: l.id, course_id: course.id, student_id: user.id, completed: done.includes(l.id), last_accessed_at: new Date().toISOString() },
      { onConflict: "lesson_id,student_id" },
    );
  }

  async function enroll() {
    if (!course) return;
    if (!user) return nav(`/lms/auth?mode=signup&next=/lms/course/${course.slug}`);
    setEnrolling(true);
    // Enrolment is granted server-side: free courses only, paid courses go through payment.
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
      "lms-enroll-free",
      { body: { course_id: course.id } },
    );
    setEnrolling(false);
    if (error || !data?.ok) {
      return toast({
        title: "Could not enrol",
        description: data?.error ?? "This course must be purchased, or an administrator has to enrol you.",
        variant: "destructive",
      });
    }
    setEnrolled(true);
    toast({ title: "Enrolled", description: `${course.title} is now in your dashboard.` });
  }

  async function toggleLesson(lesson: Lesson) {
    if (!user || !course) return nav("/lms/auth");
    if (!enrolled) return toast({ title: "Enrol first", description: "Enrol in this course to track your progress." });
    const isDone = !done.includes(lesson.id);
    const { error } = await supabase.from("lesson_progress").upsert(
      {
        lesson_id: lesson.id,
        course_id: course.id,
        student_id: user.id,
        completed: isDone,
        completed_at: isDone ? new Date().toISOString() : null,
        last_accessed_at: new Date().toISOString(),
      },
      { onConflict: "lesson_id,student_id" },
    );
    if (error) return toast({ title: "Could not save progress", description: error.message, variant: "destructive" });
    const next = isDone ? [...done, lesson.id] : done.filter((d) => d !== lesson.id);
    setDone(next);
    const percent = total ? Math.round((next.filter((id) => flat.some((l) => l.id === id)).length / total) * 100) : 0;
    await supabase
      .from("enrollments")
      .update({ progress_percent: percent, status: percent === 100 ? "completed" : "active" })
      .eq("course_id", course.id)
      .eq("student_id", user.id);
    if (isDone && activeIdx >= 0 && activeIdx < total - 1) openLesson(flat[activeIdx + 1]);
  }

  async function submitAssignment(a: Assignment) {
    if (!user || !course) return nav("/lms/auth");
    const { error } = await supabase.from("assignment_submissions").upsert(
      { assignment_id: a.id, course_id: course.id, student_id: user.id, answer_text: answers[a.id] ?? "" },
      { onConflict: "assignment_id,student_id" },
    );
    if (error) return toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    toast({ title: "Submitted", description: `${a.title} sent to your trainer for grading.` });
  }

  const attemptsLeft = quiz && quiz.retake_limit > 0 ? Math.max(0, quiz.retake_limit - attempts.length) : null;
  const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.score_percent)) : null;
  const hasPassed = attempts.some((a) => a.passed);

  async function submitQuiz() {
    if (!user || !course || !quiz) return;
    if (attemptsLeft !== null && attemptsLeft <= 0) {
      return toast({ title: "Retake limit reached", description: `This quiz allows ${quiz.retake_limit} attempts.`, variant: "destructive" });
    }
    // Grading happens server-side — the browser never sees or sends the score
    const { data, error } = await supabase.rpc("submit_quiz_attempt", {
      p_quiz_id: quiz.id,
      p_answers: questions.map((q) => ({ question_id: q.id, selected: picks[q.id] ?? null })),
    });
    if (error) return toast({ title: "Could not record attempt", description: error.message, variant: "destructive" });
    const result = (data ?? [])[0];
    const score = result?.score_percent ?? 0;
    const passed = !!result?.passed;
    await loadStudentData(course.id, user.id);
    setPicks({});
    toast({
      title: passed ? `Passed — ${score}%` : `Scored ${score}%`,
      description: passed ? "Well done! Your trainer can now issue your certificate." : `Pass mark is ${quiz.pass_percent}%. Try again.`,
      variant: passed ? undefined : "destructive",
    });

  }

  // ---------- states ----------
  if (loading) {
    return (
      <section className="section-py container mx-auto container-px flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-accent" /> Loading course…
      </section>
    );
  }

  if (loadError && !course) {
    return (
      <section className="section-py container mx-auto container-px">
        <Card className="p-6 max-w-lg">
          <p className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-5 w-5" /> Could not load this course</p>
          <p className="text-sm text-muted-foreground mt-2">{loadError}</p>
          <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </section>
    );
  }

  if (!course) {
    return (
      <section className="section-py container mx-auto container-px">
        <p className="text-muted-foreground">Course not found. <Link to="/lms/courses" className="text-accent underline">Back to catalogue</Link></p>
      </section>
    );
  }

  if (!course.is_published) {
    return (
      <section className="section-py container mx-auto container-px">
        <Card className="p-6 max-w-lg">
          <p className="flex items-center gap-2 font-semibold text-primary"><Lock className="h-5 w-5 text-accent" /> This course is not published yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            {course.title} is still being prepared by our trainers. Browse the published catalogue in the meantime.
          </p>
          <Button asChild className="mt-4 bg-gradient-accent border-0"><Link to="/lms/courses">Back to catalogue</Link></Button>
        </Card>
      </section>
    );
  }

  const opts = (o: unknown): string[] => (Array.isArray(o) ? (o as string[]) : []);
  const locked = !!user && !enrolled;

  return (
    <>
      <Seo
        title={`${course.title} — SS TECH SERVICES LMS`}
        description={course.summary ?? `Learn ${course.title} with the SS TECH SERVICES Training Academy.`}
        path={`/lms/course/${course.slug}`}
      />
      <section className="section-py container mx-auto container-px">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary">{course.category}</Badge>
          <Badge variant="outline">{course.level}</Badge>
          <Badge variant="outline">{course.duration_hours} hrs</Badge>
          <Badge variant="outline" className="gap-1"><Layers className="h-3 w-3" /> {modules.length} modules</Badge>
          <Badge variant="outline" className="gap-1"><BookOpen className="h-3 w-3" /> {total} lessons</Badge>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-primary">{course.title}</h1>
        {course.instructor && <p className="text-sm text-muted-foreground mt-1">Instructor: <span className="font-semibold text-primary">{course.instructor}</span></p>}
        <p className="text-muted-foreground mt-3 max-w-3xl">{course.description ?? course.summary}</p>

        {user && enrolled ? (
          <div className="mt-6 max-w-md rounded-lg border border-border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-primary">Course progress</span>
              <span className="font-bold text-accent tabular-nums">{pct}%</span>
            </div>
            <Progress value={pct} className="mt-2 h-3" />
            <p className="text-xs text-muted-foreground mt-2 tabular-nums">
              {completed} / {total} lessons completed{pct === 100 ? " · course completed 🎉" : ""}
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-2">
            <Button className="bg-gradient-accent border-0" disabled={enrolling} onClick={enroll}>
              {enrolling ? "Enrolling…" : user ? "Enrol now" : "Register & enrol"}
            </Button>
            {!user && (
              <Button asChild variant="outline">
                <Link to={`/lms/auth?next=/lms/course/${course.slug}`}>LMS login</Link>
              </Button>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-[340px_1fr] gap-8 mt-10">
          {/* ----- curriculum ----- */}
          <Card className="p-4 h-fit lg:sticky lg:top-24 max-h-[80vh] overflow-y-auto">
            <h2 className="font-display font-bold text-primary mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" /> Curriculum
            </h2>
            {total === 0 ? (
              <p className="text-sm text-muted-foreground px-1">No lessons available yet.</p>
            ) : (
              <div className="space-y-5">
                {grouped.map((g, gi) => {
                  const gDone = g.lessons.filter((l) => done.includes(l.id)).length;
                  return (
                    <div key={g.module.id}>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground px-1">
                        Module {gi + 1} · {g.module.title}
                        <span className="ml-1 font-semibold text-accent tabular-nums">{gDone}/{g.lessons.length}</span>
                      </p>
                      <ul className="mt-2 space-y-1">
                        {g.lessons.map((l) => {
                          const Icon = TYPE_ICON[l.lesson_type] ?? BookOpen;
                          return (
                            <li key={l.id}>
                              <button
                                onClick={() => openLesson(l)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-start gap-2 transition ${
                                  activeId === l.id ? "bg-secondary text-primary font-semibold" : "hover:bg-secondary/60"
                                }`}
                              >
                                {done.includes(l.id) ? <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                                <span className="min-w-0">
                                  {l.title}
                                  <span className="block text-xs text-muted-foreground font-normal flex items-center gap-1">
                                    <Icon className="h-3 w-3" /> {l.lesson_type} · {l.duration_minutes} min{l.is_free ? " · free preview" : ""}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                        {g.lessons.length === 0 && <li className="text-xs text-muted-foreground px-3">No lessons in this module yet.</li>}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ----- player ----- */}
          <div className="space-y-8">
            {active ? (
              <Card className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{active.lesson_type} lesson</Badge>
                  {done.includes(active.id) && <Badge className="bg-emerald-600 hover:bg-emerald-600">Completed</Badge>}
                  {active.is_free && <Badge variant="outline">Free preview</Badge>}
                </div>
                <h2 className="font-display text-xl font-bold text-primary mt-3">{active.title}</h2>
                {active.description && <p className="text-sm text-muted-foreground mt-1">{active.description}</p>}

                {locked && !active.is_free ? (
                  <div className="mt-5 rounded-md border border-border bg-secondary/50 p-6 text-center">
                    <Lock className="h-6 w-6 text-accent mx-auto" />
                    <p className="text-sm font-semibold text-primary mt-2">Access Denied</p>
                    <p className="text-sm text-muted-foreground mt-1">You are not enrolled in this course.</p>
                    <Button className="mt-4 bg-gradient-accent border-0" onClick={enroll}>Enrol now</Button>
                  </div>
                ) : (
                  <>
                    {active.lesson_type === "video" && (
                      active.video_url ? (
                        <div className="aspect-video mt-4 rounded-lg overflow-hidden bg-primary">
                          <iframe src={active.video_url} title={active.title} className="h-full w-full" allowFullScreen loading="lazy" />
                        </div>
                      ) : <p className="text-sm text-muted-foreground mt-4">The video for this lesson is being uploaded.</p>
                    )}
                    {active.lesson_type === "pdf" && (
                      active.pdf_url ? (
                        <div className="mt-4">
                          <iframe src={active.pdf_url} title={active.title} className="w-full h-[520px] rounded-lg border border-border" loading="lazy" />
                          <Button asChild variant="outline" className="mt-3"><a href={active.pdf_url} target="_blank" rel="noopener noreferrer">Open PDF in a new tab</a></Button>
                        </div>
                      ) : <p className="text-sm text-muted-foreground mt-4">The PDF for this lesson is being uploaded.</p>
                    )}
                    {active.content && (
                      <div className="mt-4 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{active.content}</div>
                    )}
                    {active.lesson_type === "quiz" && !active.content && (
                      <p className="text-sm text-muted-foreground mt-4">Scroll down to take the course assessment.</p>
                    )}
                  </>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                  <Button variant="outline" disabled={activeIdx <= 0} onClick={() => openLesson(flat[activeIdx - 1])}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                  </Button>
                  {user && enrolled ? (
                    <Button className="bg-gradient-accent border-0" onClick={() => toggleLesson(active)}>
                      {done.includes(active.id) ? "Mark as not complete" : "Mark complete"}
                    </Button>
                  ) : (
                    <Button asChild className="bg-gradient-accent border-0">
                      <Link to={user ? `/lms/course/${course.slug}` : "/lms/auth"} onClick={user ? enroll : undefined}>
                        {user ? "Enrol to track progress" : "Sign in to track progress"}
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" disabled={activeIdx < 0 || activeIdx >= total - 1} onClick={() => openLesson(flat[activeIdx + 1])}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">Lesson {activeIdx + 1} of {total}</span>
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">No lessons available yet. Our trainers are publishing this curriculum — check back soon.</p>
              </Card>
            )}

            {enrolled && assignments.length > 0 && (
              <Card className="p-6">
                <h2 className="font-display text-xl font-bold text-primary flex items-center gap-2"><FileText className="h-5 w-5 text-accent" /> Assignments</h2>
                <div className="space-y-6 mt-4">
                  {assignments.map((a) => (
                    <div key={a.id}>
                      <h3 className="font-semibold text-primary">{a.title}</h3>
                      {a.instructions && <p className="text-sm text-muted-foreground mt-1">{a.instructions}</p>}
                      <Label htmlFor={`ans-${a.id}`} className="sr-only">Your answer for {a.title}</Label>
                      <Textarea
                        id={`ans-${a.id}`}
                        className="mt-3"
                        placeholder="Type your answer or paste a link to your work…"
                        value={answers[a.id] ?? ""}
                        onChange={(e) => setAnswers({ ...answers, [a.id]: e.target.value })}
                      />
                      <Button className="mt-3" variant="outline" onClick={() => submitAssignment(a)}>Submit assignment</Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {enrolled && quiz && questions.length > 0 && (
              <Card className="p-6">
                <h2 className="font-display text-xl font-bold text-primary flex items-center gap-2"><ListChecks className="h-5 w-5 text-accent" /> {quiz.title}</h2>
                {quiz.description && <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline">Pass mark {quiz.pass_percent}%</Badge>
                  <Badge variant="outline">{quiz.retake_limit > 0 ? `${quiz.retake_limit} attempts allowed` : "Unlimited attempts"}</Badge>
                  {attemptsLeft !== null && (
                    <Badge variant={attemptsLeft > 0 ? "secondary" : "destructive"}>
                      {attemptsLeft} {attemptsLeft === 1 ? "retake" : "retakes"} left
                    </Badge>
                  )}
                  {bestScore !== null && <Badge variant="secondary">Best {bestScore}%</Badge>}
                  {hasPassed && <Badge className="bg-emerald-600 hover:bg-emerald-600">Passed</Badge>}
                </div>

                {attemptsLeft !== null && attemptsLeft <= 0 ? (
                  <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    You have used all {quiz.retake_limit} attempts for this quiz. Ask your trainer to reset it if you need another try.
                  </p>
                ) : (
                  <>
                    <div className="space-y-6 mt-5">
                      {questions.map((q, qi) => (
                        <div key={q.id}>
                          <p className="font-medium text-primary text-sm">
                            {qi + 1}. {q.question} <span className="text-xs text-muted-foreground">({q.marks} {q.marks === 1 ? "mark" : "marks"})</span>
                          </p>
                          <RadioGroup
                            className="mt-2"
                            value={picks[q.id] !== undefined ? String(picks[q.id]) : ""}
                            onValueChange={(v) => setPicks({ ...picks, [q.id]: Number(v) })}
                          >
                            {opts(q.options).map((o, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <RadioGroupItem id={`${q.id}-${oi}`} value={String(oi)} />
                                <Label htmlFor={`${q.id}-${oi}`} className="text-sm font-normal">{o}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      ))}
                    </div>
                    <Button className="mt-6 bg-gradient-accent border-0" onClick={submitQuiz}>
                      {attempts.length > 0 ? `Submit retake (attempt ${attempts.length + 1})` : "Submit quiz"}
                    </Button>
                  </>
                )}

                {attempts.length > 0 && hasPassed && (
                  <div className="mt-6 space-y-3">
                    {questions.filter((q) => q.explanation).map((q) => (
                      <p key={q.id} className="text-xs text-muted-foreground"><span className="font-semibold text-primary">{q.question}</span> — {q.explanation}</p>
                    ))}
                  </div>
                )}

                <div className="mt-8 border-t border-border pt-5">
                  <h3 className="font-display font-bold text-primary flex items-center gap-2">
                    <History className="h-4 w-4 text-accent" /> Attempt history
                  </h3>
                  {attempts.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-2">No attempts yet.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-border">
                      {attempts.map((a) => (
                        <li key={a.id} className="py-2 flex flex-wrap items-center gap-3 text-sm">
                          <span className="font-semibold text-primary">Attempt {a.attempt_number}</span>
                          <span className="tabular-nums text-accent font-bold">{a.score_percent}%</span>
                          <Badge variant={a.passed ? "default" : "outline"}>{a.passed ? "Passed" : "Failed"}</Badge>
                          <span className="ml-auto text-xs text-muted-foreground tabular-nums">{new Date(a.created_at).toLocaleString("en-IN")}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
