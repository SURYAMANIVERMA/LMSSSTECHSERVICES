import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { startPreview } from "@/hooks/useLmsAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import { LmsLoading } from "@/components/lms/AccessState";
import { Eye, UserPlus } from "lucide-react";

type Role = "admin" | "trainer" | "student" | "none";

type Person = {
  id: string;
  display_name: string | null;
  email: string | null;
  username: string | null;
  mobile_number: string | null;
  status: string;
  role: Role;
};

type Course = { id: string; title: string };
type Assignment = { id: string; course_id: string; trainer_id: string };
type Enrollment = { id: string; course_id: string; student_id: string };

async function callAdmin(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
    "lms-admin-users",
    { body },
  );
  if (error) {
    const message = (data as { error?: string } | null)?.error ?? "Action failed. Please try again.";
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function AdminUsers() {
  const nav = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [busy, setBusy] = useState(true);
  const [q, setQ] = useState("");
  const [working, setWorking] = useState<string | null>(null);

  // create form
  const [nu, setNu] = useState({ full_name: "", email: "", username: "", mobile_number: "", password: "", role: "trainer" });

  // assignment forms
  const [assignForm, setAssignForm] = useState({ trainer_id: "", course_id: "" });
  const [enrolForm, setEnrolForm] = useState({ student_id: "", course_id: "" });

  const load = useCallback(async () => {
    setBusy(true);
    const [{ data: profs }, { data: roles }, { data: crs }, { data: tca }, { data: enr }] = await Promise.all([
      supabase.from("profiles").select("id,display_name,email,username,mobile_number,status").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("courses").select("id,title").order("title"),
      supabase.from("trainer_course_assignments").select("id,course_id,trainer_id"),
      supabase.from("enrollments").select("id,course_id,student_id"),
    ]);
    const roleMap = new Map<string, Role>();
    (roles ?? []).forEach((r) => {
      const role = r.role as Role;
      if (role === "admin") roleMap.set(r.user_id, "admin");
      else if (!roleMap.has(r.user_id) || roleMap.get(r.user_id) === "none") roleMap.set(r.user_id, role);
    });
    setPeople(
      (profs ?? []).map((p) => ({
        id: p.id,
        display_name: p.display_name,
        email: p.email,
        username: p.username,
        mobile_number: p.mobile_number,
        status: p.status ?? "active",
        role: roleMap.get(p.id) ?? "none",
      })),
    );
    setCourses((crs ?? []) as Course[]);
    setAssignments((tca ?? []) as Assignment[]);
    setEnrollments((enr ?? []) as Enrollment[]);
    setBusy(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const trainers = people.filter((p) => p.role === "trainer");
  const students = people.filter((p) => p.role === "student");
  const filtered = people.filter((p) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return [p.display_name, p.email, p.username, p.mobile_number].some((v) => (v ?? "").toLowerCase().includes(s));
  });

  async function run(key: string, fn: () => Promise<unknown>, success: string) {
    setWorking(key);
    try {
      await fn();
      toast({ title: success });
      await load();
    } catch (e) {
      toast({ title: "Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setWorking(null);
    }
  }

  function preview(p: Person, role: "student" | "trainer") {
    startPreview({ userId: p.id, role, label: p.display_name || p.email || "user" });
    nav(role === "student" ? "/student/dashboard" : "/trainer/dashboard");
  }

  if (busy) return <LmsLoading label="Loading users…" />;

  return (
    <>
      <Seo title="User Management — SS TECH SERVICES LMS" description="Manage students, trainers, roles, course assignments and enrolments." path="/admin/users" noindex />
      <section className="section-py container mx-auto container-px">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary mb-1">Users &amp; access</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {people.length} accounts · {trainers.length} trainers · {students.length} students
        </p>

        <Tabs defaultValue="people">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="people">All users</TabsTrigger>
            <TabsTrigger value="create">Create account</TabsTrigger>
            <TabsTrigger value="trainers">Trainer ↔ course</TabsTrigger>
            <TabsTrigger value="enrol">Student enrolments</TabsTrigger>
          </TabsList>

          {/* ---------- users ---------- */}
          <TabsContent value="people">
            <Input
              placeholder="Search by name, email, username or mobile"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-sm mb-4"
            />
            <Card className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium text-primary">{p.display_name ?? "—"}</div>
                        {p.username && <div className="text-xs text-muted-foreground">@{p.username}</div>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>{p.email}</div>
                        {p.mobile_number && <div>{p.mobile_number}</div>}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={p.role}
                          onValueChange={(role) => run(`role-${p.id}`, () => callAdmin({ action: "set_role", user_id: p.id, role }), "Role updated")}
                        >
                          <SelectTrigger className="w-[130px]" disabled={working === `role-${p.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="trainer">Trainer</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="none">No access</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === "disabled" ? "destructive" : "secondary"}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="mr-2"
                          disabled={working === `status-${p.id}`}
                          onClick={() =>
                            run(
                              `status-${p.id}`,
                              () => callAdmin({ action: "set_status", user_id: p.id, status: p.status === "disabled" ? "active" : "disabled" }),
                              p.status === "disabled" ? "Account enabled" : "Account disabled",
                            )
                          }
                        >
                          {p.status === "disabled" ? "Enable" : "Disable"}
                        </Button>
                        {(p.role === "student" || p.role === "trainer") && (
                          <Button size="sm" variant="ghost" onClick={() => preview(p, p.role as "student" | "trainer")}>
                            <Eye className="mr-1 h-3.5 w-3.5" /> Test as
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ---------- create ---------- */}
          <TabsContent value="create">
            <Card className="p-6 max-w-lg">
              <h2 className="font-semibold text-primary mb-4 flex items-center gap-2"><UserPlus className="h-4 w-4 text-accent" /> Create a trainer or student account</h2>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  run("create", async () => {
                    await callAdmin({ action: "create_user", ...nu });
                    setNu({ full_name: "", email: "", username: "", mobile_number: "", password: "", role: "trainer" });
                  }, "Account created");
                }}
              >
                <div><Label htmlFor="nu-name">Full name</Label><Input id="nu-name" required value={nu.full_name} onChange={(e) => setNu({ ...nu, full_name: e.target.value })} /></div>
                <div><Label htmlFor="nu-email">Email</Label><Input id="nu-email" type="email" required value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} /></div>
                <div><Label htmlFor="nu-user">Username</Label><Input id="nu-user" value={nu.username} onChange={(e) => setNu({ ...nu, username: e.target.value })} /></div>
                <div><Label htmlFor="nu-mob">Mobile number</Label><Input id="nu-mob" value={nu.mobile_number} onChange={(e) => setNu({ ...nu, mobile_number: e.target.value })} placeholder="9876543210" /></div>
                <div><Label htmlFor="nu-pass">Temporary password (min 6)</Label><Input id="nu-pass" type="password" required minLength={6} value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} /></div>
                <div>
                  <Label>Role</Label>
                  <Select value={nu.role} onValueChange={(role) => setNu({ ...nu, role })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trainer">Trainer</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button disabled={working === "create"} className="bg-gradient-accent border-0">
                  {working === "create" ? "Creating…" : "Create account"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* ---------- trainer assignments ---------- */}
          <TabsContent value="trainers">
            <Card className="p-6 max-w-lg mb-6">
              <h2 className="font-semibold text-primary mb-4">Assign a course to a trainer</h2>
              <div className="grid gap-4">
                <div>
                  <Label>Trainer</Label>
                  <Select value={assignForm.trainer_id} onValueChange={(v) => setAssignForm({ ...assignForm, trainer_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select a trainer" /></SelectTrigger>
                    <SelectContent>
                      {trainers.map((t) => <SelectItem key={t.id} value={t.id}>{t.display_name ?? t.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Course</Label>
                  <Select value={assignForm.course_id} onValueChange={(v) => setAssignForm({ ...assignForm, course_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="bg-gradient-accent border-0"
                  disabled={!assignForm.trainer_id || !assignForm.course_id || working === "assign"}
                  onClick={() =>
                    run("assign", async () => {
                      const { error } = await supabase.from("trainer_course_assignments").insert(assignForm);
                      if (error) throw new Error(error.message);
                      setAssignForm({ trainer_id: "", course_id: "" });
                    }, "Course assigned")
                  }
                >
                  Assign course
                </Button>
              </div>
            </Card>

            <Card className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Trainer</TableHead><TableHead>Course</TableHead><TableHead className="text-right">Remove</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-sm text-muted-foreground">No trainer assignments yet.</TableCell></TableRow>
                  )}
                  {assignments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{people.find((p) => p.id === a.trainer_id)?.display_name ?? people.find((p) => p.id === a.trainer_id)?.email ?? a.trainer_id}</TableCell>
                      <TableCell>{courses.find((c) => c.id === a.course_id)?.title ?? a.course_id}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={working === `del-${a.id}`}
                          onClick={() => run(`del-${a.id}`, async () => {
                            const { error } = await supabase.from("trainer_course_assignments").delete().eq("id", a.id);
                            if (error) throw new Error(error.message);
                          }, "Assignment removed")}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ---------- enrolments ---------- */}
          <TabsContent value="enrol">
            <Card className="p-6 max-w-lg mb-6">
              <h2 className="font-semibold text-primary mb-4">Enrol a student in a course</h2>
              <div className="grid gap-4">
                <div>
                  <Label>Student</Label>
                  <Select value={enrolForm.student_id} onValueChange={(v) => setEnrolForm({ ...enrolForm, student_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.display_name ?? s.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Course</Label>
                  <Select value={enrolForm.course_id} onValueChange={(v) => setEnrolForm({ ...enrolForm, course_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="bg-gradient-accent border-0"
                  disabled={!enrolForm.student_id || !enrolForm.course_id || working === "enrol"}
                  onClick={() =>
                    run("enrol", async () => {
                      const { error } = await supabase
                        .from("enrollments")
                        .insert({ student_id: enrolForm.student_id, course_id: enrolForm.course_id });
                      if (error) throw new Error(error.message);
                      setEnrolForm({ student_id: "", course_id: "" });
                    }, "Student enrolled")
                  }
                >
                  Enrol student
                </Button>
              </div>
            </Card>

            <Card className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Student</TableHead><TableHead>Course</TableHead><TableHead className="text-right">Remove</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-sm text-muted-foreground">No enrolments yet.</TableCell></TableRow>
                  )}
                  {enrollments.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{people.find((p) => p.id === e.student_id)?.display_name ?? people.find((p) => p.id === e.student_id)?.email ?? e.student_id}</TableCell>
                      <TableCell>{courses.find((c) => c.id === e.course_id)?.title ?? e.course_id}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={working === `unenrol-${e.id}`}
                          onClick={() => run(`unenrol-${e.id}`, async () => {
                            const { error } = await supabase.from("enrollments").delete().eq("id", e.id);
                            if (error) throw new Error(error.message);
                          }, "Enrolment removed")}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
