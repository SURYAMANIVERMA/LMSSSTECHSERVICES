import { useEffect, useMemo, useState } from "react";
import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { BookOpen, Award, FileText, Video, ClipboardCheck, BarChart3, Users, Shield, Search, GraduationCap } from "lucide-react";
import { lmsSupabase } from "@/integrations/supabase/lmsClient";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: BookOpen, title: "Course Catalog", text: "Industry-aligned programs from beginner to advanced." },
  { icon: Video, title: "Video Lessons", text: "Course lessons with resumable learning progress." },
  { icon: ClipboardCheck, title: "Assignments", text: "Structured labs and assignments for practical skills." },
  { icon: FileText, title: "Quizzes", text: "Auto-graded assessments with server-side scoring." },
  { icon: BarChart3, title: "Progress Tracking", text: "Persist lesson completion and course progress." },
  { icon: Award, title: "Certificates", text: "Verifiable completion certificates with unique IDs." },
];

function LoginForm({ role }: { role: "Student" | "Trainer" | "Admin" }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [name, setName] = useState("");
  const navigate = useNavigate();

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await lmsSupabase.auth.signInWithPassword({ email, password: pw });
    if (error || !data.user) {
      setLoading(false);
      toast({ title: "Login failed", description: error?.message || "Unable to sign in", variant: "destructive" });
      return;
    }

    let { data: roleRows } = await lmsSupabase.from("user_roles").select("role").eq("user_id", data.user.id);
    let actualRole = roleRows?.[0]?.role as string | undefined;

    // A newly registered account without an assigned staff role becomes a student on first LMS login.
    if (!actualRole && role === "Student") {
      const { data: ensured, error: ensureError } = await lmsSupabase.rpc("ensure_student_role");
      if (ensureError) {
        await lmsSupabase.auth.signOut();
        setLoading(false);
        toast({ title: "Student setup failed", description: ensureError.message, variant: "destructive" });
        return;
      }
      actualRole = ensured as string;
    }

    const allowed = role === "Admin"
      ? actualRole === "admin"
      : role === "Trainer"
        ? actualRole === "trainer" || actualRole === "engineer"
        : actualRole === "student";

    if (!allowed) {
      await lmsSupabase.auth.signOut();
      setLoading(false);
      toast({ title: "Access denied", description: `This account is not a ${role.toLowerCase()} account.`, variant: "destructive" });
      return;
    }

    setLoading(false);
    toast({ title: "Login successful", description: `Welcome to SS TECH SERVICES LMS.` });
    navigate(actualRole === "admin" ? "/admin/tickets" : actualRole === "trainer" || actualRole === "engineer" ? "/trainer-dashboard" : "/dashboard");
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (role !== "Student") return;
    setLoading(true);
    const { data, error } = await lmsSupabase.auth.signUp({
      email,
      password: pw,
      options: { data: { display_name: name }, emailRedirectTo: `${window.location.origin}/#/lms` },
    });
    if (error) {
      setLoading(false);
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      return;
    }
    if (data.session) await lmsSupabase.rpc("ensure_student_role");
    setLoading(false);
    toast({ title: "Student account created", description: data.session ? "You can start learning now." : "Check your email to verify the account, then sign in." });
    setShowSignup(false);
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button type="button" variant={!showSignup ? "default" : "outline"} onClick={() => setShowSignup(false)} className="flex-1">Sign In</Button>
        {role === "Student" && <Button type="button" variant={showSignup ? "default" : "outline"} onClick={() => setShowSignup(true)} className="flex-1">Register</Button>}
      </div>
      <form onSubmit={showSignup ? signUp : signIn} className="grid gap-4">
        {showSignup && <div><Label>Full Name</Label><Input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></div>}
        <div><Label>Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        <div><Label>Password</Label><Input type="password" required minLength={6} value={pw} onChange={e => setPw(e.target.value)} placeholder="Minimum 6 characters" /></div>
        <Button disabled={loading} type="submit" className="bg-gradient-accent border-0 shadow-accent">{loading ? "Please wait…" : showSignup ? "Create Student Account" : `Sign in as ${role}`}</Button>
      </form>
    </div>
  );
}

export default function LMS() {
  const [courses, setCourses] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    lmsSupabase.from("lms_courses").select("*").eq("published", true).order("category").order("title").then(({ data }) => setCourses(data || []));
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(courses.map(c => c.category)))], [courses]);
  const filtered = courses.filter(c => (category === "All" || c.category === category) && `${c.title} ${c.description} ${c.category}`.toLowerCase().includes(query.toLowerCase()));

  async function enroll(courseId: string) {
    setEnrolling(courseId);
    const { data: { user } } = await lmsSupabase.auth.getUser();
    if (!user) {
      setEnrolling(null);
      toast({ title: "Login required", description: "Please sign in as a Student first." });
      return;
    }
    const { data: roleRows } = await lmsSupabase.from("user_roles").select("role").eq("user_id", user.id);
    if (roleRows?.[0]?.role !== "student") {
      setEnrolling(null);
      toast({ title: "Student account required", description: "Use a Student LMS account to enroll." });
      return;
    }
    const { error } = await lmsSupabase.from("lms_enrollments").upsert({ student_id: user.id, course_id: courseId }, { onConflict: "student_id,course_id" });
    setEnrolling(null);
    toast(error ? { title: "Enrollment failed", description: error.message, variant: "destructive" } : { title: "Enrolled", description: "Course added to your student dashboard." });
  }

  return (
    <>
      <PageHero eyebrow="LMS Portal" title={<>Learn, practice, <span className="text-accent">get certified.</span></>} sub="A real database-backed LMS for students, trainers and administrators — with enrollment, progress, quizzes and certificates." />
      <section className="section-py container mx-auto container-px">
        <div className="grid lg:grid-cols-2 gap-10 items-start mb-12">
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map(f => <Card key={f.title} className="p-5 border-border hover:shadow-elegant transition"><f.icon className="h-7 w-7 text-accent mb-3" /><h3 className="font-display font-bold text-primary">{f.title}</h3><p className="text-sm text-muted-foreground mt-1">{f.text}</p></Card>)}
          </div>
          <Card className="p-7 shadow-elegant">
            <div className="flex items-center gap-2 mb-1"><GraduationCap className="h-6 w-6 text-accent" /><h2 className="font-display text-2xl font-bold text-primary">LMS Login</h2></div>
            <p className="text-sm text-muted-foreground mb-5">Separate Student, Trainer and Admin access.</p>
            <Tabs defaultValue="student"><TabsList className="grid grid-cols-3 w-full"><TabsTrigger value="student"><Users className="h-4 w-4 mr-1"/>Student</TabsTrigger><TabsTrigger value="trainer"><BookOpen className="h-4 w-4 mr-1"/>Trainer</TabsTrigger><TabsTrigger value="admin"><Shield className="h-4 w-4 mr-1"/>Admin</TabsTrigger></TabsList><TabsContent value="student" className="pt-5"><LoginForm role="Student" /></TabsContent><TabsContent value="trainer" className="pt-5"><LoginForm role="Trainer" /></TabsContent><TabsContent value="admin" className="pt-5"><LoginForm role="Admin" /></TabsContent></Tabs>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6"><div><h2 className="font-display text-3xl font-bold text-primary">Course Catalog</h2><p className="text-muted-foreground">Enroll in job-oriented IT programs.</p></div><div className="relative w-full md:w-80"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search courses…" className="pl-9"/></div></div>
        <div className="flex gap-2 flex-wrap mb-6">{categories.map(c => <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>{c}</Button>)}</div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(course => <Card key={course.id} className="overflow-hidden border-border hover:shadow-elegant transition group"><div className="h-36 bg-gradient-to-br from-primary via-primary/80 to-accent/70 relative overflow-hidden"><div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,white,transparent_25%),radial-gradient(circle_at_80%_70%,#00e5ff,transparent_30%)] group-hover:scale-110 transition-transform duration-700"/><div className="absolute bottom-3 left-4 text-white"><Badge variant="secondary">{course.category}</Badge></div></div><div className="p-5"><h3 className="font-display font-bold text-primary text-lg">{course.title}</h3><p className="text-sm text-muted-foreground mt-2 line-clamp-3">{course.description}</p><div className="flex flex-wrap gap-2 mt-4"><Badge variant="outline">{course.level}</Badge><Badge variant="outline">{course.duration_hours} hrs</Badge></div><Button className="w-full mt-5" onClick={() => enroll(course.id)} disabled={enrolling === course.id}>{enrolling === course.id ? "Enrolling…" : "Enroll Now"}</Button></div></Card>)}
        </div>
      </section>
    </>
  );
}
