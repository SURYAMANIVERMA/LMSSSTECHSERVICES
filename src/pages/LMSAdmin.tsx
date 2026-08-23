import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { lmsSupabase } from "@/integrations/supabase/lmsClient";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Users, BookOpen, LogOut } from "lucide-react";

export default function LMSAdmin() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string,string>>({});
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  async function load() {
    const { data: { user } } = await lmsSupabase.auth.getUser();
    if (!user) { nav("/lms"); return; }
    const { data: myRoles } = await lmsSupabase.from("user_roles").select("role").eq("user_id", user.id);
    if (myRoles?.[0]?.role !== "admin") { nav("/lms"); return; }
    const [{ data: people }, { data: allRoles }, { data: allCourses }] = await Promise.all([
      lmsSupabase.from("profiles").select("id,display_name,email").order("created_at", { ascending: false }),
      lmsSupabase.from("user_roles").select("user_id,role"),
      lmsSupabase.from("lms_courses").select("id,title,category").order("title"),
    ]);
    const map: Record<string,string> = {};
    (allRoles || []).forEach((r: any) => { map[r.user_id] = r.role; });
    setProfiles(people || []); setRoles(map); setCourses(allCourses || []); setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function setRole(userId: string, role: "student" | "trainer") {
    const { error } = await lmsSupabase.rpc("admin_set_lms_role", { p_user_id: userId, p_role: role });
    if (error) toast({ title: "Role update failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Role updated" }); await load(); }
  }

  async function assignCourse(courseId: string, trainerId: string) {
    const { error } = await lmsSupabase.rpc("admin_assign_course_trainer", { p_course_id: courseId, p_trainer_id: trainerId });
    if (error) toast({ title: "Assignment failed", description: error.message, variant: "destructive" });
    else toast({ title: "Trainer assigned" });
  }

  const trainers = profiles.filter(p => roles[p.id] === "trainer" || roles[p.id] === "engineer");
  if (loading) return <div className="container mx-auto py-20 text-center text-muted-foreground">Loading LMS administration…</div>;

  return <div className="container mx-auto container-px py-10"><div className="flex items-center justify-between mb-8"><div><div className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-accent"/><h1 className="text-3xl font-bold text-primary">LMS Administration</h1></div><p className="text-muted-foreground">Manage student/trainer roles and trainer-course assignments.</p></div><Button variant="outline" onClick={async()=>{await lmsSupabase.auth.signOut();nav("/lms")}}><LogOut className="h-4 w-4 mr-2"/>Sign out</Button></div>
    <div className="grid lg:grid-cols-2 gap-6"><Card className="p-6"><div className="flex items-center gap-2 mb-5"><Users className="h-5 w-5 text-accent"/><h2 className="text-xl font-bold">Accounts</h2></div><div className="space-y-3">{profiles.map(p => <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-lg p-3"><div><p className="font-medium">{p.display_name || p.email}</p><p className="text-xs text-muted-foreground">{p.email}</p></div><div className="flex items-center gap-2"><Badge variant="outline">{roles[p.id] || "unassigned"}</Badge>{roles[p.id] !== "admin" && <Select value={roles[p.id] === "trainer" ? "trainer" : "student"} onValueChange={(v)=>setRole(p.id,v as "student"|"trainer")}><SelectTrigger className="w-32"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="trainer">Trainer</SelectItem></SelectContent></Select>}</div></div>)}</div></Card>
      <Card className="p-6"><div className="flex items-center gap-2 mb-5"><BookOpen className="h-5 w-5 text-accent"/><h2 className="text-xl font-bold">Assign Courses</h2></div>{courses.length === 0 ? <p className="text-muted-foreground">No courses found.</p> : <div className="space-y-4">{courses.map(c => <div key={c.id} className="border rounded-lg p-4"><p className="font-semibold">{c.title}</p><p className="text-xs text-muted-foreground mb-3">{c.category}</p><Select onValueChange={(trainerId)=>assignCourse(c.id,trainerId)}><SelectTrigger><SelectValue placeholder={trainers.length ? "Select trainer" : "Create a trainer first"}/></SelectTrigger><SelectContent>{trainers.map(t=><SelectItem key={t.id} value={t.id}>{t.display_name || t.email}</SelectItem>)}</SelectContent></Select></div>)}</div>}</Card></div></div>;
}
