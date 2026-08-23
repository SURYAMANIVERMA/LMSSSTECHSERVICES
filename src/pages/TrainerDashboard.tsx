import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Video, ClipboardCheck, CalendarCheck, FileText, LogOut } from "lucide-react";
import { lmsSupabase } from "@/integrations/supabase/lmsClient";
import { useNavigate } from "react-router-dom";

export default function TrainerDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await lmsSupabase.auth.getUser();
      if (!user) { nav("/lms"); return; }
      const { data: roles } = await lmsSupabase.from("user_roles").select("role").eq("user_id", user.id);
      if (!roles?.some((r: any) => r.role === "trainer" || r.role === "engineer" || r.role === "admin")) { nav("/lms"); return; }
      const { data } = await lmsSupabase.from("lms_course_trainers").select("*, lms_courses(*)").eq("trainer_id", user.id);
      setCourses(data || []);
      const { count } = await lmsSupabase.from("lms_enrollments").select("id", { count: "exact", head: true });
      setStudents(count || 0);
    })();
  }, [nav]);

  async function signOut() { await lmsSupabase.auth.signOut(); nav("/lms"); }
  const stats = [
    { title: "Assigned Courses", value: courses.length, icon: BookOpen },
    { title: "Total Students", value: students, icon: Users },
    { title: "Video Lessons", value: "—", icon: Video },
    { title: "Assignments", value: "—", icon: ClipboardCheck },
  ];
  return <div className="container mx-auto container-px py-10"><div className="flex items-center justify-between mb-8"><div><p className="text-sm text-accent font-semibold">TRAINER PORTAL</p><h1 className="text-3xl font-bold text-primary">Trainer Dashboard</h1><p className="text-muted-foreground">Manage assigned courses and learning operations.</p></div><Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2"/>Sign out</Button></div><div className="grid md:grid-cols-4 gap-5 mb-8">{stats.map(item => <Card key={item.title} className="p-5"><item.icon className="h-8 w-8 text-accent mb-3"/><p className="text-sm text-muted-foreground">{item.title}</p><p className="text-2xl font-bold">{item.value}</p></Card>)}</div><div className="grid md:grid-cols-2 gap-5"><Card className="p-6"><Video className="h-8 w-8 text-accent mb-3"/><h2 className="font-bold text-lg">Learning Content</h2><p className="text-sm text-muted-foreground mt-2">Manage lessons, video URLs and course materials through the LMS database.</p><Button className="mt-4" onClick={() => nav("/lms")}>Open LMS</Button></Card><Card className="p-6"><ClipboardCheck className="h-8 w-8 text-accent mb-3"/><h2 className="font-bold text-lg">Quizzes & Assignments</h2><p className="text-sm text-muted-foreground mt-2">Quiz questions and server-side scoring are stored in the LMS backend.</p><Button className="mt-4" variant="outline" onClick={() => nav("/lms")}>View LMS</Button></Card></div><h2 className="text-2xl font-bold text-primary mt-10 mb-5">Assigned Courses</h2>{courses.length ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{courses.map(c => <Card key={c.id} className="p-5"><Badge>{c.lms_courses?.category}</Badge><h3 className="font-bold mt-3">{c.lms_courses?.title}</h3><p className="text-sm text-muted-foreground mt-2">{c.lms_courses?.description}</p></Card>)}</div> : <Card className="p-8"><p className="text-muted-foreground">No courses assigned yet. An admin can assign courses using the LMS database.</p></Card>}</div>;
}
