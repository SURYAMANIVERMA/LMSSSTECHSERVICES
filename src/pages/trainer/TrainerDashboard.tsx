import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLmsAuth } from "@/hooks/useLmsAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Seo from "@/components/Seo";
import { LmsLoading } from "@/components/lms/AccessState";
import { BookOpen, ClipboardList, ListChecks, Users } from "lucide-react";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  permissions: { content: boolean; grade: boolean; quizzes: boolean };
  students: number;
  avgProgress: number;
  pendingGrading: number;
  quizCount: number;
};

export default function TrainerDashboard() {
  const { profile, subjectId } = useLmsAuth();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!subjectId) return;
    let active = true;
    setBusy(true);
    (async () => {
      const [{ data: assigns }, { data: owned }] = await Promise.all([
        supabase
          .from("trainer_course_assignments")
          .select("course_id, can_manage_content, can_grade, can_manage_quizzes, courses(id,slug,title,category,status)")
          .eq("trainer_id", subjectId),
        supabase.from("courses").select("id,slug,title,category,status").eq("trainer_id", subjectId),
      ]);
      if (!active) return;

      const base = new Map<string, CourseRow>();
      (owned ?? []).forEach((c) =>
        base.set(c.id, {
          id: c.id, slug: c.slug, title: c.title, category: c.category, status: c.status,
          permissions: { content: true, grade: true, quizzes: true },
          students: 0, avgProgress: 0, pendingGrading: 0, quizCount: 0,
        }),
      );
      (assigns ?? []).forEach((a) => {
        const c = a.courses as unknown as { id: string; slug: string; title: string; category: string; status: string } | null;
        if (!c) return;
        base.set(c.id, {
          id: c.id, slug: c.slug, title: c.title, category: c.category, status: c.status,
          permissions: { content: a.can_manage_content, grade: a.can_grade, quizzes: a.can_manage_quizzes },
          students: 0, avgProgress: 0, pendingGrading: 0, quizCount: 0,
        });
      });

      const ids = [...base.keys()];
      if (ids.length > 0) {
        const [{ data: enr }, { data: subs }, { data: qz }] = await Promise.all([
          supabase.from("enrollments").select("course_id, progress_percent").in("course_id", ids),
          supabase.from("assignment_submissions").select("course_id, score").in("course_id", ids),
          supabase.from("quizzes").select("id, course_id").in("course_id", ids),
        ]);
        if (!active) return;
        const buckets: Record<string, number[]> = {};
        (enr ?? []).forEach((e) => {
          (buckets[e.course_id] ??= []).push(e.progress_percent ?? 0);
        });
        ids.forEach((id) => {
          const row = base.get(id)!;
          const list = buckets[id] ?? [];
          row.students = list.length;
          row.avgProgress = list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : 0;
          row.pendingGrading = (subs ?? []).filter((s) => s.course_id === id && s.score === null).length;
          row.quizCount = (qz ?? []).filter((q) => q.course_id === id).length;
        });
      }

      setCourses([...base.values()]);
      setBusy(false);
    })();
    return () => { active = false; };
  }, [subjectId]);

  if (busy) return <LmsLoading label="Loading your courses…" />;

  const totalStudents = courses.reduce((a, c) => a + c.students, 0);
  const totalPending = courses.reduce((a, c) => a + c.pendingGrading, 0);

  return (
    <>
      <Seo title="Trainer Dashboard — SS TECH SERVICES LMS" description="Your assigned courses, enrolled students, progress and pending submissions." path="/trainer/dashboard" noindex />
      <section className="section-py container mx-auto container-px">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary">
          Welcome, {profile?.display_name || profile?.email || "Trainer"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 mb-8">
          Trainer · {profile?.email} · you can only see the courses assigned to you.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat icon={<BookOpen className="h-4 w-4" />} label="Assigned courses" value={courses.length} />
          <Stat icon={<Users className="h-4 w-4" />} label="Enrolled students" value={totalStudents} />
          <Stat icon={<ClipboardList className="h-4 w-4" />} label="Pending grading" value={totalPending} />
          <Stat icon={<ListChecks className="h-4 w-4" />} label="Quizzes" value={courses.reduce((a, c) => a + c.quizCount, 0)} />
        </div>

        <h2 className="font-display text-xl font-bold text-primary mb-4">My assigned courses</h2>
        {courses.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">
            No courses are assigned to your account yet. An administrator must assign a course before you can start teaching.
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c) => (
              <Card key={c.id} className="p-6">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="secondary">{c.category}</Badge>
                  <Badge variant="outline">{c.status}</Badge>
                </div>
                <h3 className="font-display text-lg font-bold text-primary">{c.title}</h3>
                <div className="mt-4 text-xs text-muted-foreground space-y-1">
                  <p>{c.students} enrolled {c.students === 1 ? "student" : "students"}</p>
                  <p>{c.pendingGrading} submission{c.pendingGrading === 1 ? "" : "s"} awaiting grading</p>
                  <p>{c.quizCount} quiz{c.quizCount === 1 ? "" : "zes"}</p>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Average class progress</span>
                  <span className="text-accent tabular-nums">{c.avgProgress}%</span>
                </div>
                <Progress value={c.avgProgress} className="mt-2 h-2.5" />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="flex-1"><Link to={`/lms/course/${c.slug}`}>View course</Link></Button>
                  {c.permissions.content && (
                    <Button asChild className="flex-1 bg-gradient-accent border-0"><Link to={`/lms/manage/course/${c.id}`}>Teaching tools</Link></Button>
                  )}
                </div>
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
