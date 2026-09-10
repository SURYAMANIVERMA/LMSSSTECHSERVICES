import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLmsAuth } from "@/hooks/useLmsAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Seo from "@/components/Seo";
import { LmsLoading } from "@/components/lms/AccessState";
import { downloadCertificatePdf } from "@/lib/certificate";
import { Award, BookOpen, CheckCircle2, ClipboardList, Download, GraduationCap, PlayCircle } from "lucide-react";

type Row = {
  id: string;
  course_id: string;
  progress_percent: number;
  status: string;
  courses: { slug: string; title: string; category: string } | null;
};

type Cert = {
  id: string;
  certificate_no: string;
  course_title: string | null;
  student_name: string | null;
  issued_at: string;
};

export default function StudentDashboard() {
  const { profile, subjectId, user } = useLmsAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [stats, setStats] = useState<Record<string, { done: number; total: number }>>({});
  const [quizzes, setQuizzes] = useState({ attempted: 0, passed: 0 });
  const [assignments, setAssignments] = useState({ submitted: 0, graded: 0, pending: 0 });
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!subjectId) return;
    let active = true;
    setBusy(true);
    (async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("id,course_id,progress_percent,status,courses(slug,title,category)")
        .eq("student_id", subjectId);
      if (!active) return;
      const list = (data ?? []) as unknown as Row[];
      setRows(list);
      const ids = list.map((r) => r.course_id);

      const [{ data: certRows }, { data: attempts }] = await Promise.all([
        supabase
          .from("certificates")
          .select("id,certificate_no,course_title,student_name,issued_at")
          .eq("student_id", subjectId)
          .eq("status", "approved"),
        supabase.from("quiz_attempts").select("quiz_id,passed").eq("student_id", subjectId),
      ]);
      if (!active) return;
      setCerts((certRows ?? []) as Cert[]);
      const attemptList = attempts ?? [];
      setQuizzes({
        attempted: new Set(attemptList.map((a) => a.quiz_id)).size,
        passed: new Set(attemptList.filter((a) => a.passed).map((a) => a.quiz_id)).size,
      });

      if (ids.length === 0) {
        setStats({});
        setAssignments({ submitted: 0, graded: 0, pending: 0 });
        setBusy(false);
        return;
      }

      const [{ data: lessons }, { data: prog }, { data: subs }, { data: courseAssignments }] =
        await Promise.all([
          supabase.from("lessons").select("id,course_id").in("course_id", ids),
          supabase
            .from("lesson_progress")
            .select("lesson_id,course_id,completed")
            .eq("student_id", subjectId)
            .in("course_id", ids),
          supabase
            .from("assignment_submissions")
            .select("assignment_id,score")
            .eq("student_id", subjectId),
          supabase.from("assignments").select("id").in("course_id", ids),
        ]);
      if (!active) return;

      const next: Record<string, { done: number; total: number }> = {};
      ids.forEach((id) => (next[id] = { done: 0, total: 0 }));
      (lessons ?? []).forEach((l) => { if (next[l.course_id]) next[l.course_id].total += 1; });
      (prog ?? []).forEach((p) => { if (p.completed && next[p.course_id]) next[p.course_id].done += 1; });
      setStats(next);

      const submitted = subs ?? [];
      setAssignments({
        submitted: submitted.length,
        graded: submitted.filter((s) => s.score !== null).length,
        pending: Math.max((courseAssignments ?? []).length - submitted.length, 0),
      });
      setBusy(false);
    })();
    return () => { active = false; };
  }, [subjectId]);

  const percentFor = (r: Row) => {
    const s = stats[r.course_id];
    if (s && s.total > 0) return Math.round((s.done / s.total) * 100);
    return r.progress_percent;
  };

  const overall = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + percentFor(r), 0) / rows.length)
    : 0;
  const completed = rows.filter((r) => percentFor(r) === 100).length;
  const inProgress = rows.filter((r) => { const p = percentFor(r); return p > 0 && p < 100; }).length;
  const notStarted = rows.filter((r) => percentFor(r) === 0).length;
  const continueCourse = rows.find((r) => { const p = percentFor(r); return p > 0 && p < 100; }) ?? rows[0];

  const name = profile?.display_name || profile?.email || user?.email || "Learner";
  const initials = name.slice(0, 2).toUpperCase();

  if (busy) return <LmsLoading label="Loading your dashboard…" />;

  return (
    <>
      <Seo title="Student Dashboard — SS TECH SERVICES LMS" description="Your enrolled courses, progress, quizzes, assignments and certificates." path="/student/dashboard" noindex />
      <section className="section-py container mx-auto container-px">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Avatar className="h-14 w-14">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={name} />}
            <AvatarFallback className="bg-gradient-accent text-primary-foreground font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-[200px]">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary">Welcome back, {name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Student · {profile?.email}
              {profile?.username && <span> · @{profile.username}</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link to="/lms/courses"><BookOpen className="mr-2 h-4 w-4" /> Browse courses</Link></Button>
            <Button asChild variant="outline"><Link to="/student/profile">My profile</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat icon={<GraduationCap className="h-4 w-4" />} label="My courses" value={rows.length} />
          <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={completed} />
          <Stat icon={<PlayCircle className="h-4 w-4" />} label="In progress" value={inProgress} />
          <Stat icon={<Award className="h-4 w-4" />} label="Certificates" value={certs.length} />
        </div>

        {rows.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-5 mb-10">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-primary">Overall progress</span>
                <span className="tabular-nums font-bold text-accent">{overall}%</span>
              </div>
              <Progress value={overall} className="mt-3 h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {completed} completed · {inProgress} in progress · {notStarted} not started
              </p>
              {continueCourse?.courses && (
                <Button asChild className="mt-5 bg-gradient-accent border-0">
                  <Link to={`/lms/course/${continueCourse.courses.slug}`}>
                    <PlayCircle className="mr-2 h-4 w-4" /> Continue learning: {continueCourse.courses.title}
                  </Link>
                </Button>
              )}
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold text-primary text-sm flex items-center gap-2 mb-3">
                <ClipboardList className="h-4 w-4 text-accent" /> Quizzes &amp; assignments
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>Quizzes attempted: <span className="text-primary font-semibold">{quizzes.attempted}</span></li>
                <li>Quizzes passed: <span className="text-primary font-semibold">{quizzes.passed}</span></li>
                <li>Assignments submitted: <span className="text-primary font-semibold">{assignments.submitted}</span></li>
                <li>Graded: <span className="text-primary font-semibold">{assignments.graded}</span></li>
                <li>Pending submission: <span className="text-primary font-semibold">{assignments.pending}</span></li>
              </ul>
            </Card>
          </div>
        )}

        <h2 className="font-display text-xl font-bold text-primary mb-4">My courses</h2>
        {rows.length === 0 ? (
          <Card className="p-6 text-muted-foreground text-sm">
            No courses assigned to your account yet. <Link to="/lms/courses" className="text-accent underline">Browse the catalogue</Link> or contact the academy team to enrol.
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rows.map((r) => {
              const pct = percentFor(r);
              const s = stats[r.course_id];
              return (
                <Card key={r.id} className="p-6">
                  <Badge variant="secondary" className="mb-2">{r.courses?.category}</Badge>
                  <h3 className="font-display text-lg font-bold text-primary">{r.courses?.title}</h3>
                  <div className="mt-4 flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-accent tabular-nums">{pct}%</span>
                  </div>
                  <Progress value={pct} className="mt-2 h-2.5" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {s && s.total > 0 ? `${s.done} of ${s.total} lessons complete` : "Lessons are being published"} · {pct === 100 ? "completed" : pct === 0 ? "not started" : "in progress"}
                  </p>
                  <Button asChild className="mt-4 w-full bg-gradient-accent border-0">
                    <Link to={`/lms/course/${r.courses?.slug}`}>{pct > 0 ? "Continue learning" : "Start learning"}</Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        <h2 className="font-display text-xl font-bold text-primary mt-12 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" /> Certificates
        </h2>
        {certs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No certificates issued yet — complete a course to earn one.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {certs.map((c) => (
              <Card key={c.id} className="p-6 bg-gradient-dark text-primary-foreground">
                <p className="text-xs uppercase tracking-wider opacity-80">Certificate of completion</p>
                <h3 className="font-display text-lg font-bold mt-1">{c.course_title}</h3>
                <p className="text-xs mt-3 opacity-80">No. {c.certificate_no}</p>
                <p className="text-xs opacity-80">Issued {new Date(c.issued_at).toLocaleDateString("en-IN")}</p>
                <Button className="mt-4 w-full bg-gradient-accent border-0" onClick={() => downloadCertificatePdf(c)}>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <p className="font-display text-2xl font-bold text-primary mt-1 tabular-nums">{value}</p>
    </Card>
  );
}
