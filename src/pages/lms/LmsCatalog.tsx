import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useLmsAuth } from "@/hooks/useLmsAuth";
import Seo from "@/components/Seo";
import PageHero from "@/components/PageHero";
import academy from "@/assets/academy.jpg";
import LiveMedia, { courseMedia } from "@/components/LiveMedia";
import { payWithRazorpay } from "@/lib/razorpay";
import { Clock, ArrowRight, UserPlus, LogIn, Layers, BookOpen } from "lucide-react";

type Course = {
  id: string;
  slug: string;
  title: string;
  category: string;
  level: string;
  summary: string | null;
  duration_hours: number;
  price_inr: number;
};

export default function LmsCatalog() {
  const { user } = useLmsAuth();
  const nav = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolled, setEnrolled] = useState<string[]>([]);
  const [counts, setCounts] = useState<{ modules: Record<string, number>; lessons: Record<string, number> }>({ modules: {}, lessons: {} });
  const [q, setQ] = useState("");
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("courses")
      .select("id,slug,title,category,level,summary,duration_hours,price_inr")
      .eq("is_published", true)
      .order("title")
      .then(({ data }) => setCourses((data ?? []) as Course[]));
    const tally = (rows: { course_id: string }[] | null) =>
      (rows ?? []).reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.course_id]: (acc[r.course_id] ?? 0) + 1 }), {});
    Promise.all([
      supabase.from("course_modules").select("course_id"),
      supabase.from("lessons").select("course_id"),
    ]).then(([m, l]) => setCounts({ modules: tally(m.data), lessons: tally(l.data) }));
  }, []);

  useEffect(() => {
    if (!user) return setEnrolled([]);
    supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", user.id)
      .then(({ data }) => setEnrolled((data ?? []).map((e) => e.course_id)));
  }, [user]);

  async function enroll(courseId: string) {
    if (!user) {
      toast({ title: "Sign in to enrol", description: "Create a free student account — it takes under a minute." });
      return nav(`/lms/auth?next=/lms/courses&course=${courseId}`);
    }
    const course = courses.find((c) => c.id === courseId);
    if (course && course.price_inr > 0) {
      setPaying(courseId);
      const res = await payWithRazorpay({ purpose: "course", course_id: courseId });
      setPaying(null);
      if (res.status === "success") {
        setEnrolled((e) => [...e, courseId]);
        return toast({ title: "Payment successful", description: "You are enrolled — the course is now in your dashboard." });
      }
      if (res.status === "error") {
        return toast({ title: "Payment failed", description: res.message, variant: "destructive" });
      }
      return;
    }
    // Free enrolment is granted server-side so nobody can self-enrol into a paid course.
    const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
      "lms-enroll-free",
      { body: { course_id: courseId } },
    );
    if (error || !data?.ok) {
      return toast({
        title: "Could not enrol",
        description: data?.error ?? "Please try again, or ask an administrator to enrol you.",
        variant: "destructive",
      });
    }
    setEnrolled((e) => [...e, courseId]);
    toast({ title: "Enrolled", description: "The course is now in your dashboard." });
  }

  const list = courses.filter(
    (c) => c.title.toLowerCase().includes(q.toLowerCase()) || c.category.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <Seo
        title="Course Catalogue — SS TECH SERVICES LMS"
        description="Browse Cyber Security, Ethical Hacking, SOC, Linux, RHCSA, Kubernetes, OpenShift, AWS, DevOps, Python and Full Stack courses in the SS TECH SERVICES Training Academy."
        path="/lms/courses"
      />
      <PageHero
        image={academy}
        imageAlt="Students learning cyber security in a modern training lab"
        live="Live batches running · Lucknow"
        eyebrow="Training Academy"
        title={<>Course <span className="text-accent">catalogue</span></>}
        sub="Job-oriented programmes with video lessons, assignments, quizzes and certificates."
      />
      <section className="section-py container mx-auto container-px">
        {!user && (
          <div className="mb-8 rounded-xl bg-gradient-dark text-primary-foreground p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">Start learning with SS TECH SERVICES LMS</h2>
              <p className="text-sm opacity-80 mt-1">
                Register as a student to enrol in any course, track lesson progress, submit assignments and earn certificates.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild className="bg-gradient-accent border-0">
                <Link to="/lms/auth?mode=signup&next=/lms/courses"><UserPlus className="mr-2 h-4 w-4" /> Student registration</Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-white/10">
                <Link to="/lms/auth?next=/lms/courses"><LogIn className="mr-2 h-4 w-4" /> LMS login</Link>
              </Button>
            </div>
          </div>
        )}
        <div className="max-w-md mb-8">
          <Input aria-label="Search courses" placeholder="Search courses…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {list.length === 0 ? (
          <p className="text-muted-foreground">No published courses yet. Trainers can publish courses from the LMS management area.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((c) => (
              <Card key={c.id} className="group overflow-hidden flex flex-col border-border hover:border-accent/50 hover:shadow-elegant transition">
                <LiveMedia media={courseMedia(c.category, c.title)} label="Batch live" className="h-36" />
                <div className="p-6 flex flex-col flex-1">
                <div className="flex gap-2 mb-3">
                  <Badge variant="secondary">{c.category}</Badge>
                  <Badge variant="outline">{c.level}</Badge>
                </div>
                <h2 className="font-display text-xl font-bold text-primary">{c.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 flex-1">{c.summary}</p>
                <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.duration_hours} hrs</span>
                  <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {counts.modules[c.id] ?? 0} modules</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {counts.lessons[c.id] ?? 0} lessons</span>
                  <span className="font-semibold text-primary">{c.price_inr > 0 ? `₹${c.price_inr.toLocaleString("en-IN")}` : "Free"}</span>
                </div>
                <div className="mt-5 flex gap-2">
                  {enrolled.includes(c.id) ? (
                    <Button asChild className="flex-1 bg-gradient-accent border-0">
                      <Link to={`/lms/course/${c.slug}`}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                  ) : user ? (
                    <Button className="flex-1 bg-gradient-accent border-0" disabled={paying === c.id} onClick={() => enroll(c.id)}>
                      {paying === c.id ? "Opening payment…" : c.price_inr > 0 ? `Pay ₹${c.price_inr.toLocaleString("en-IN")} & enrol` : "Enrol free"}
                    </Button>
                  ) : (
                    <Button asChild className="flex-1 bg-gradient-accent border-0">
                      <Link to={`/lms/auth?mode=signup&next=/lms/courses&course=${c.slug}`}>
                        <UserPlus className="mr-1.5 h-4 w-4" /> Register & enrol
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline"><Link to={`/lms/course/${c.slug}`}>Details</Link></Button>
                </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}