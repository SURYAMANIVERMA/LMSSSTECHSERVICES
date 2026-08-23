import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { TICKET_STATUS_META } from "@/data/site";
import { LogOut, RefreshCw, ShieldCheck, Wrench, Phone, Clock, Search } from "lucide-react";

type Role = "admin" | "engineer";
type TicketStatus = "new" | "assigned" | "in_progress" | "resolved" | "closed";
type Ticket = {
  id: string;
  public_ref: string;
  customer_name: string;
  customer_phone: string;
  issue_type: string;
  detail: string | null;
  status: TicketStatus;
  assigned_to: string | null;
  engineer_name: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};
type Profile = { id: string; display_name: string | null; email: string | null };

const STATUSES: TicketStatus[] = ["new", "assigned", "in_progress", "resolved", "closed"];

export default function AdminTickets() {
  const nav = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [myName, setMyName] = useState<string>("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [engineers, setEngineers] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Ticket | null>(null);
  const [note, setNote] = useState("");

  // Auth gate + load role
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) nav("/admin/auth");
      else setUserId(s.user.id);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) nav("/admin/auth");
      else setUserId(data.session.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [{ data: roles }, { data: prof }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("display_name,email").eq("id", userId).maybeSingle(),
      ]);
      const r = (roles?.[0]?.role as Role | undefined) || null;
      setRole(r);
      setMyName(prof?.display_name || prof?.email || "Staff");
      if (r === "admin") {
        const { data: engs } = await supabase
          .from("profiles")
          .select("id,display_name,email");
        setEngineers(engs || []);
      }
    })();
  }, [userId]);

  async function loadTickets() {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setTickets((data || []) as Ticket[]);
  }

  useEffect(() => { if (role) loadTickets(); }, [role]);

  // Realtime
  useEffect(() => {
    if (!role) return;
    const ch = supabase
      .channel("admin-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, payload => {
        loadTickets();
        if (payload.eventType === "INSERT") {
          const t = payload.new as Ticket;
          toast({ title: "🔔 New ticket: " + t.public_ref, description: `${t.customer_name} · ${t.issue_type}` });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [role]);

  const filtered = useMemo(() => tickets.filter(t => {
    if (filter !== "all" && t.status !== filter) return false;
    if (q && !(t.public_ref.toLowerCase().includes(q.toLowerCase()) || t.customer_name.toLowerCase().includes(q.toLowerCase()) || t.customer_phone.includes(q))) return false;
    return true;
  }), [tickets, filter, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tickets.length };
    STATUSES.forEach(s => { c[s] = tickets.filter(t => t.status === s).length; });
    return c;
  }, [tickets]);

  async function updateTicket(t: Ticket, patch: Partial<Ticket>) {
    const prev = t.status;
    const { error } = await supabase.from("support_tickets").update(patch as any).eq("id", t.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    // Log status change
    if (patch.status && patch.status !== prev) {
      await supabase.from("ticket_updates").insert({
        ticket_id: t.id,
        author_id: userId,
        author_name: myName,
        from_status: prev as TicketStatus,
        to_status: patch.status as TicketStatus,
        note: note || null,
      });
      setNote("");
    }
    toast({ title: "Updated ✓" });
    loadTickets();
    setActive(null);
  }

  async function assign(t: Ticket, engId: string) {
    const eng = engineers.find(e => e.id === engId);
    await updateTicket(t, {
      assigned_to: engId,
      engineer_name: eng?.display_name || eng?.email || null,
      status: t.status === "new" ? "assigned" : t.status,
    });
  }

  if (!role) return <div className="container mx-auto py-20 text-center text-muted-foreground">Loading…</div>;

  return (
    <section className="section-py container mx-auto container-px">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent" /><h1 className="font-display text-2xl md:text-3xl font-bold text-primary">Support Dashboard</h1></div>
          <p className="text-sm text-muted-foreground">Signed in as <strong>{myName}</strong> · Role: <Badge variant="outline" className="ml-1">{role}</Badge></p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/admin/lms">LMS Admin</Link></Button>
          <Button variant="outline" size="sm" onClick={loadTickets}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={async () => { await supabase.auth.signOut(); nav("/admin/auth"); }}><LogOut className="h-4 w-4 mr-1" />Logout</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[{ k: "all", label: "All" }, ...STATUSES.map(s => ({ k: s, label: TICKET_STATUS_META[s].label }))].map(s => (
          <button key={s.k} onClick={() => setFilter(s.k)}
            className={`rounded-lg border-2 p-3 text-left transition ${filter === s.k ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="font-display text-2xl font-bold text-primary">{counts[s.k] ?? 0}</div>
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by ticket ID, name or phone…" className="pl-10 h-11" />
      </div>

      <div className="grid gap-3">
        {filtered.map(t => (
          <Card key={t.id} className="p-4 hover:shadow-elegant transition cursor-pointer" onClick={() => setActive(t)}>
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-primary">{t.public_ref}</span>
                  <Badge className={`${TICKET_STATUS_META[t.status].color} text-white border-0 text-xs`}>{TICKET_STATUS_META[t.status].label}</Badge>
                </div>
                <div className="text-sm mt-1"><strong>{t.customer_name}</strong> · <Wrench className="inline h-3 w-3 mx-1" />{t.issue_type}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                  <span><Phone className="inline h-3 w-3 mr-1" />{t.customer_phone}</span>
                  <span><Clock className="inline h-3 w-3 mr-1" />{new Date(t.created_at).toLocaleString()}</span>
                  {t.engineer_name && <span>👨‍🔧 {t.engineer_name}</span>}
                </div>
              </div>
              <Button size="sm" variant="outline">Manage →</Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <Card className="p-10 text-center text-muted-foreground">No tickets match.</Card>}
      </div>

      {/* Ticket detail dialog */}
      <Dialog open={!!active} onOpenChange={o => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">{active.public_ref}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 text-sm">
                <div><strong>{active.customer_name}</strong> · <a href={`tel:${active.customer_phone}`} className="text-accent">{active.customer_phone}</a></div>
                <div><span className="text-muted-foreground">Issue:</span> {active.issue_type}</div>
                {active.detail && <div className="rounded bg-muted p-3 text-sm">{active.detail}</div>}

                {role === "admin" && (
                  <div>
                    <Label>Assign engineer</Label>
                    <select className="w-full h-10 mt-1 rounded-md border border-input bg-background px-3 text-sm"
                      value={active.assigned_to || ""}
                      onChange={e => assign(active, e.target.value)}>
                      <option value="">— Unassigned —</option>
                      {engineers.map(en => <option key={en.id} value={en.id}>{en.display_name || en.email}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <Label>Status note (optional, sent to activity log)</Label>
                  <Textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Engineer reached site, working on it" />
                </div>

                <div>
                  <Label>Change status</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                    {STATUSES.map(s => (
                      <Button key={s} size="sm" variant={active.status === s ? "default" : "outline"}
                        className={active.status === s ? "bg-gradient-accent border-0 shadow-accent" : ""}
                        onClick={() => updateTicket(active, { status: s })}>
                        {TICKET_STATUS_META[s].label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}