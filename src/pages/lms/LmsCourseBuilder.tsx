import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLmsAuth } from "@/hooks/useLmsAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import {
  Plus, Trash2, ArrowUp, ArrowDown, Pencil, Layers, BookOpen, Users, Save, ArrowLeft, ExternalLink, Loader2,
} from "lucide-react";

type Course = {
  id: string; slug: string; title: string; category: string; level: string; summary: string | null;
  short_description: string | null; description: string | null; cover_url: string | null; instructor: string | null;
  duration_hours: number; price_inr: number; status: string; sort_order: number; is_published: boolean;
};
type Module = { id: string; title: string; description: string | null; sort_order: number };
type Lesson = {
  id: string; module_id: string | null; title: string; description: string | null; lesson_type: string;
  video_url: string | null; pdf_url: string | null; content: string | null; position: number;
  duration_minutes: number; is_free: boolean;
};

const LESSON_TYPES = ["video", "pdf", "text", "quiz"] as const;
const emptyLesson = {
  title: "", description: "", lesson_type: "video" as string, video_url: "", pdf_url: "", content: "",
  duration_minutes: 15, is_free: false,
};

export default function LmsCourseBuilder() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, loading, canManage } = useLmsAuth();
  const [busy, setBusy] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrolCount, setEnrolCount] = useState(0);
  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [editModule, setEditModule] = useState<Module | null>(null);
  const [lessonTarget, setLessonTarget] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ ...emptyLesson });
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (!loading && !user) nav("/lms/auth", { replace: true });
  }, [loading, user, nav]);

  const load = useCallback(async () => {
    if (!id) return;
    setBusy(true);
    const [{ data: c }, { data: mods }, { data: ls }, { count }] = await Promise.all([
      supabase
        .from("courses")
        .select("id,slug,title,category,level,summary,short_description,description,cover_url,instructor,duration_hours,price_inr,status,sort_order,is_published")
        .eq("id", id)
        .maybeSingle(),
      supabase.from("course_modules").select("id,title,description,sort_order").eq("course_id", id).order("sort_order"),
      supabase
        .from("lessons")
        .select("id,module_id,title,description,lesson_type,video_url,pdf_url,content,position,duration_minutes,is_free")
        .eq("course_id", id)
        .order("position"),
      supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("course_id", id),
    ]);
    setCourse(c as Course | null);
    setModules((mods ?? []) as Module[]);
    setLessons((ls ?? []) as Lesson[]);
    setEnrolCount(count ?? 0);
    setBusy(false);
  }, [id]);

  useEffect(() => { if (canManage) load(); }, [canManage, load]);

  if (!loading && user && !canManage) {
    return (
      <section className="section-py container mx-auto container-px">
        <Card className="p-6">
          <h1 className="font-display text-xl font-bold text-primary">Trainer access required</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Ask an administrator for the trainer role. <Link to="/lms" className="text-accent underline">Back to My Learning</Link>
          </p>
        </Card>
      </section>
    );
  }

  if (busy || !course) {
    return (
      <section className="section-py container mx-auto container-px flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-accent" /> Loading course content…
      </section>
    );
  }

  // ---------- course settings ----------
  async function saveCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    const { error } = await supabase
      .from("courses")
      .update({
        title: course.title, category: course.category, level: course.level, summary: course.summary,
        short_description: course.short_description, description: course.description, cover_url: course.cover_url,
        instructor: course.instructor, duration_hours: course.duration_hours, price_inr: course.price_inr,
        status: course.status, sort_order: course.sort_order,
      })
      .eq("id", course.id);
    if (error) return toast({ title: "Could not save course", description: error.message, variant: "destructive" });
    toast({ title: "Course saved", description: `${course.title} updated.` });
    load();
  }

  async function deleteCourse() {
    if (!course) return;
    if (!confirm(`Delete "${course.title}" and all of its modules, lessons and quizzes? This cannot be undone.`)) return;
    const { error } = await supabase.from("courses").delete().eq("id", course.id);
    if (error) return toast({ title: "Could not delete course", description: error.message, variant: "destructive" });
    toast({ title: "Course deleted" });
    nav("/lms/manage");
  }

  // ---------- modules ----------
  async function addModule(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    const { error } = await supabase.from("course_modules").insert({
      course_id: course.id, title: newModule.title, description: newModule.description || null,
      sort_order: (modules.at(-1)?.sort_order ?? 0) + 1,
    });
    if (error) return toast({ title: "Could not add module", description: error.message, variant: "destructive" });
    setNewModule({ title: "", description: "" });
    toast({ title: "Module added" });
    load();
  }

  async function saveModule() {
    if (!editModule) return;
    const { error } = await supabase
      .from("course_modules")
      .update({ title: editModule.title, description: editModule.description })
      .eq("id", editModule.id);
    if (error) return toast({ title: "Could not save module", description: error.message, variant: "destructive" });
    setEditModule(null);
    toast({ title: "Module updated" });
    load();
  }

  async function deleteModule(m: Module) {
    const count = lessons.filter((l) => l.module_id === m.id).length;
    if (!confirm(`Delete module "${m.title}"${count ? ` and its ${count} lesson(s)` : ""}?`)) return;
    await supabase.from("lessons").delete().eq("module_id", m.id);
    const { error } = await supabase.from("course_modules").delete().eq("id", m.id);
    if (error) return toast({ title: "Could not delete module", description: error.message, variant: "destructive" });
    toast({ title: "Module deleted" });
    load();
  }

  async function moveModule(index: number, dir: -1 | 1) {
    const a = modules[index], b = modules[index + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("course_modules").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("course_modules").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    load();
  }

  // ---------- lessons ----------
  async function addLesson(moduleId: string, e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    const maxPos = lessons.reduce((m, l) => Math.max(m, l.position), 0);
    const { error } = await supabase.from("lessons").insert({
      course_id: course.id,
      module_id: moduleId === "__none" ? null : moduleId,
      title: lessonForm.title,
      description: lessonForm.description || null,
      lesson_type: lessonForm.lesson_type,
      video_url: lessonForm.video_url || null,
      pdf_url: lessonForm.pdf_url || null,
      content: lessonForm.content || null,
      duration_minutes: lessonForm.duration_minutes,
      is_free: lessonForm.is_free,
      position: maxPos + 1,
    });
    if (error) return toast({ title: "Could not add lesson", description: error.message, variant: "destructive" });
    setLessonForm({ ...emptyLesson });
    setLessonTarget(null);
    toast({ title: "Lesson added" });
    load();
  }

  async function saveLesson() {
    if (!editLesson) return;
    const { error } = await supabase
      .from("lessons")
      .update({
        title: editLesson.title, description: editLesson.description, lesson_type: editLesson.lesson_type,
        video_url: editLesson.video_url, pdf_url: editLesson.pdf_url, content: editLesson.content,
        duration_minutes: editLesson.duration_minutes, is_free: editLesson.is_free, module_id: editLesson.module_id,
      })
      .eq("id", editLesson.id);
    if (error) return toast({ title: "Could not save lesson", description: error.message, variant: "destructive" });
    setEditLesson(null);
    toast({ title: "Lesson updated" });
    load();
  }

  async function deleteLesson(l: Lesson) {
    if (!confirm(`Delete lesson "${l.title}"?`)) return;
    const { error } = await supabase.from("lessons").delete().eq("id", l.id);
    if (error) return toast({ title: "Could not delete lesson", description: error.message, variant: "destructive" });
    toast({ title: "Lesson deleted" });
    load();
  }

  async function moveLesson(list: Lesson[], index: number, dir: -1 | 1) {
    const a = list[index], b = list[index + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("lessons").update({ position: b.position }).eq("id", a.id),
      supabase.from("lessons").update({ position: a.position }).eq("id", b.id),
    ]);
    load();
  }

  const groups: { id: string; title: string; description: string | null; module: Module | null }[] = [
    ...modules.map((m) => ({ id: m.id, title: m.title, description: m.description, module: m })),
    ...(lessons.some((l) => !l.module_id) ? [{ id: "__none", title: "Unassigned lessons", description: null, module: null }] : []),
  ];

  return (
    <>
      <Seo title={`Course builder — ${course.title} — SS TECH SERVICES`} description="Trainer course content management." path={`/lms/manage/course/${course.id}`} noindex />
      <section className="section-py container mx-auto container-px">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <Button asChild variant="outline" size="sm"><Link to="/lms/manage"><ArrowLeft className="mr-1.5 h-4 w-4" /> LMS Management</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to={`/lms/course/${course.slug}`}>Preview as student <ExternalLink className="ml-1.5 h-4 w-4" /></Link></Button>
        </div>
        <h1 className="font-display text-3xl font-bold text-primary mt-4">{course.title}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant={course.status === "published" ? "default" : "outline"} className="capitalize">{course.status}</Badge>
          <Badge variant="outline" className="gap-1"><Layers className="h-3 w-3" /> {modules.length} modules</Badge>
          <Badge variant="outline" className="gap-1"><BookOpen className="h-3 w-3" /> {lessons.length} lessons</Badge>
          <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" /> {enrolCount} enrolled</Badge>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-8 mt-8">
          {/* course settings */}
          <Card className="p-6 h-fit">
            <h2 className="font-display text-lg font-bold text-primary mb-4">Course settings</h2>
            <form className="grid gap-3" onSubmit={saveCourse}>
              <div><Label htmlFor="b-title">Title</Label><Input id="b-title" required value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="b-cat">Category</Label><Input id="b-cat" value={course.category} onChange={(e) => setCourse({ ...course, category: e.target.value })} /></div>
                <div><Label htmlFor="b-lvl">Level</Label><Input id="b-lvl" value={course.level} onChange={(e) => setCourse({ ...course, level: e.target.value })} /></div>
              </div>
              <div><Label htmlFor="b-inst">Instructor</Label><Input id="b-inst" value={course.instructor ?? ""} onChange={(e) => setCourse({ ...course, instructor: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="b-hrs">Duration (hours)</Label><Input id="b-hrs" type="number" min={1} value={course.duration_hours} onChange={(e) => setCourse({ ...course, duration_hours: Number(e.target.value) })} /></div>
                <div><Label htmlFor="b-fee">Fee (INR)</Label><Input id="b-fee" type="number" min={0} value={course.price_inr} onChange={(e) => setCourse({ ...course, price_inr: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="b-status">Status</Label>
                  <Select value={course.status} onValueChange={(v) => setCourse({ ...course, status: v })}>
                    <SelectTrigger id="b-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="unpublished">Unpublished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label htmlFor="b-sort">Sort order</Label><Input id="b-sort" type="number" value={course.sort_order} onChange={(e) => setCourse({ ...course, sort_order: Number(e.target.value) })} /></div>
              </div>
              <div><Label htmlFor="b-thumb">Thumbnail URL</Label><Input id="b-thumb" placeholder="https://…" value={course.cover_url ?? ""} onChange={(e) => setCourse({ ...course, cover_url: e.target.value })} /></div>
              <div><Label htmlFor="b-short">Short description</Label><Input id="b-short" value={course.short_description ?? ""} onChange={(e) => setCourse({ ...course, short_description: e.target.value })} /></div>
              <div><Label htmlFor="b-sum">Catalogue summary</Label><Input id="b-sum" value={course.summary ?? ""} onChange={(e) => setCourse({ ...course, summary: e.target.value })} /></div>
              <div><Label htmlFor="b-desc">Full description</Label><Textarea id="b-desc" rows={5} value={course.description ?? ""} onChange={(e) => setCourse({ ...course, description: e.target.value })} /></div>
              <Button className="bg-gradient-accent border-0"><Save className="mr-2 h-4 w-4" /> Save course</Button>
              <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={deleteCourse}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete course
              </Button>
            </form>
          </Card>

          {/* modules + lessons */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="font-display text-lg font-bold text-primary mb-4 flex items-center gap-2"><Plus className="h-4 w-4 text-accent" /> New module</h2>
              <form className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end" onSubmit={addModule}>
                <div><Label htmlFor="m-title">Module title</Label><Input id="m-title" required value={newModule.title} onChange={(e) => setNewModule({ ...newModule, title: e.target.value })} /></div>
                <div><Label htmlFor="m-desc">Description</Label><Input id="m-desc" value={newModule.description} onChange={(e) => setNewModule({ ...newModule, description: e.target.value })} /></div>
                <Button className="bg-gradient-accent border-0">Add module</Button>
              </form>
            </Card>

            {groups.length === 0 && (
              <Card className="p-6"><p className="text-sm text-muted-foreground">No modules yet. Add your first module above, then add lessons to it.</p></Card>
            )}

            {groups.map((g, gi) => {
              const list = lessons.filter((l) => (g.id === "__none" ? !l.module_id : l.module_id === g.id)).sort((a, b) => a.position - b.position);
              return (
                <Card key={g.id} className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display font-bold text-primary">
                        {g.module ? `Module ${gi + 1} · ` : ""}{g.title}
                        <span className="ml-2 text-xs font-semibold text-muted-foreground">{list.length} lessons</span>
                      </h3>
                      {g.description && <p className="text-xs text-muted-foreground mt-1">{g.description}</p>}
                    </div>
                    {g.module && (
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" aria-label="Move module up" disabled={gi === 0} onClick={() => moveModule(gi, -1)}><ArrowUp className="h-4 w-4" /></Button>
                        <Button size="icon" variant="outline" aria-label="Move module down" disabled={gi >= modules.length - 1} onClick={() => moveModule(gi, 1)}><ArrowDown className="h-4 w-4" /></Button>
                        <Button size="icon" variant="outline" aria-label="Edit module" onClick={() => setEditModule(g.module)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="outline" aria-label="Delete module" className="text-destructive" onClick={() => deleteModule(g.module!)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>

                  <ul className="mt-4 divide-y divide-border">
                    {list.map((l, li) => (
                      <li key={l.id} className="py-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground tabular-nums w-6">{li + 1}.</span>
                        <span className="font-medium text-primary text-sm">{l.title}</span>
                        <Badge variant="secondary" className="capitalize">{l.lesson_type}</Badge>
                        <span className="text-xs text-muted-foreground">{l.duration_minutes} min</span>
                        {l.is_free && <Badge variant="outline">Free</Badge>}
                        <div className="ml-auto flex items-center gap-1">
                          <Button size="icon" variant="ghost" aria-label="Move lesson up" disabled={li === 0} onClick={() => moveLesson(list, li, -1)}><ArrowUp className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" aria-label="Move lesson down" disabled={li >= list.length - 1} onClick={() => moveLesson(list, li, 1)}><ArrowDown className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" aria-label="Edit lesson" onClick={() => setEditLesson(l)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" aria-label="Delete lesson" className="text-destructive" onClick={() => deleteLesson(l)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </li>
                    ))}
                    {list.length === 0 && <li className="py-2 text-sm text-muted-foreground">No lessons in this module yet.</li>}
                  </ul>

                  {lessonTarget === g.id ? (
                    <form className="mt-4 grid gap-3 rounded-lg border border-border p-4" onSubmit={(e) => addLesson(g.id, e)}>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div><Label htmlFor={`nl-t-${g.id}`}>Lesson title</Label><Input id={`nl-t-${g.id}`} required value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} /></div>
                        <div>
                          <Label htmlFor={`nl-type-${g.id}`}>Type</Label>
                          <Select value={lessonForm.lesson_type} onValueChange={(v) => setLessonForm({ ...lessonForm, lesson_type: v })}>
                            <SelectTrigger id={`nl-type-${g.id}`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {LESSON_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div><Label htmlFor={`nl-d-${g.id}`}>Description</Label><Input id={`nl-d-${g.id}`} value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} /></div>
                      {lessonForm.lesson_type === "video" && (
                        <div><Label htmlFor={`nl-v-${g.id}`}>Video embed URL</Label><Input id={`nl-v-${g.id}`} placeholder="https://www.youtube.com/embed/…" value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} /></div>
                      )}
                      {lessonForm.lesson_type === "pdf" && (
                        <div><Label htmlFor={`nl-p-${g.id}`}>PDF URL</Label><Input id={`nl-p-${g.id}`} placeholder="https://…/notes.pdf" value={lessonForm.pdf_url} onChange={(e) => setLessonForm({ ...lessonForm, pdf_url: e.target.value })} /></div>
                      )}
                      <div><Label htmlFor={`nl-c-${g.id}`}>Text content / notes</Label><Textarea id={`nl-c-${g.id}`} rows={4} value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} /></div>
                      <div className="flex flex-wrap items-end gap-4">
                        <div><Label htmlFor={`nl-m-${g.id}`}>Minutes</Label><Input id={`nl-m-${g.id}`} className="w-28" type="number" min={1} value={lessonForm.duration_minutes} onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: Number(e.target.value) })} /></div>
                        <div className="flex items-center gap-2 pb-2">
                          <Switch id={`nl-f-${g.id}`} checked={lessonForm.is_free} onCheckedChange={(v) => setLessonForm({ ...lessonForm, is_free: v })} />
                          <Label htmlFor={`nl-f-${g.id}`}>Free preview</Label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="bg-gradient-accent border-0">Add lesson</Button>
                        <Button type="button" variant="outline" onClick={() => { setLessonTarget(null); setLessonForm({ ...emptyLesson }); }}>Cancel</Button>
                      </div>
                    </form>
                  ) : (
                    <Button className="mt-4" variant="outline" onClick={() => { setLessonTarget(g.id); setLessonForm({ ...emptyLesson }); }}>
                      <Plus className="mr-1.5 h-4 w-4" /> Add lesson
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* edit module */}
      <Dialog open={!!editModule} onOpenChange={(o) => !o && setEditModule(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit module</DialogTitle></DialogHeader>
          {editModule && (
            <div className="grid gap-3">
              <div><Label htmlFor="em-t">Title</Label><Input id="em-t" value={editModule.title} onChange={(e) => setEditModule({ ...editModule, title: e.target.value })} /></div>
              <div><Label htmlFor="em-d">Description</Label><Textarea id="em-d" value={editModule.description ?? ""} onChange={(e) => setEditModule({ ...editModule, description: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModule(null)}>Cancel</Button>
            <Button className="bg-gradient-accent border-0" onClick={saveModule}>Save module</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* edit lesson */}
      <Dialog open={!!editLesson} onOpenChange={(o) => !o && setEditLesson(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit lesson</DialogTitle></DialogHeader>
          {editLesson && (
            <div className="grid gap-3">
              <div><Label htmlFor="el-t">Title</Label><Input id="el-t" value={editLesson.title} onChange={(e) => setEditLesson({ ...editLesson, title: e.target.value })} /></div>
              <div>
                <Label htmlFor="el-type">Type</Label>
                <Select value={editLesson.lesson_type} onValueChange={(v) => setEditLesson({ ...editLesson, lesson_type: v })}>
                  <SelectTrigger id="el-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{LESSON_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="el-mod">Module</Label>
                <Select value={editLesson.module_id ?? "__none"} onValueChange={(v) => setEditLesson({ ...editLesson, module_id: v === "__none" ? null : v })}>
                  <SelectTrigger id="el-mod"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Unassigned</SelectItem>
                    {modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label htmlFor="el-d">Description</Label><Input id="el-d" value={editLesson.description ?? ""} onChange={(e) => setEditLesson({ ...editLesson, description: e.target.value })} /></div>
              {editLesson.lesson_type === "video" && (
                <div><Label htmlFor="el-v">Video embed URL</Label><Input id="el-v" value={editLesson.video_url ?? ""} onChange={(e) => setEditLesson({ ...editLesson, video_url: e.target.value })} /></div>
              )}
              {editLesson.lesson_type === "pdf" && (
                <div><Label htmlFor="el-p">PDF URL</Label><Input id="el-p" value={editLesson.pdf_url ?? ""} onChange={(e) => setEditLesson({ ...editLesson, pdf_url: e.target.value })} /></div>
              )}
              <div><Label htmlFor="el-c">Text content / notes</Label><Textarea id="el-c" rows={5} value={editLesson.content ?? ""} onChange={(e) => setEditLesson({ ...editLesson, content: e.target.value })} /></div>
              <div className="flex flex-wrap items-end gap-4">
                <div><Label htmlFor="el-m">Minutes</Label><Input id="el-m" className="w-28" type="number" min={1} value={editLesson.duration_minutes} onChange={(e) => setEditLesson({ ...editLesson, duration_minutes: Number(e.target.value) })} /></div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch id="el-f" checked={editLesson.is_free} onCheckedChange={(v) => setEditLesson({ ...editLesson, is_free: v })} />
                  <Label htmlFor="el-f">Free preview</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLesson(null)}>Cancel</Button>
            <Button className="bg-gradient-accent border-0" onClick={saveLesson}>Save lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
