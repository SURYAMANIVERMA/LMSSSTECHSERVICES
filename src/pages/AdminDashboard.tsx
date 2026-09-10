import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import { RefreshCw, Search, IndianRupee, GraduationCap, CreditCard, Loader2 } from "lucide-react";

type Enrolment = {
  id: string;
  status: string;
  progress_percent: number;
  created_at: string;
  courses: { title: string; price_inr: number } | null;
  profiles: { display_name: string | null; email: string | null } | null;
};
type Payment = {
  id: string;
  purpose: string;
  order_id: string;
  payment_id: string | null;
  amount_inr: number;
  status: string;
  customer_email: string | null;
  created_at: string;
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function AdminDashboard() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [q, setQ] = useState("");
  const [payFilter, setPayFilter] = useState("all");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) nav("/admin/auth");
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) nav("/admin/auth");
      else setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  async function load() {
    setLoading(true);
    const [e, p] = await Promise.all([
      supabase
        .from("enrollments")
        .select("id,student_id,status,progress_percent,created_at,courses(title,price_inr)")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(300),
    ]);
    if (e.error && p.error) {
      toast({ title: "Load failed", description: e.error.message, variant: "destructive" });
    }
    const rows = ((e.data ?? []) as unknown) as (Enrolment & { student_id: string })[];
    // Learner details come from profiles separately (enrolments link to the auth user).
    const ids = [...new Set(rows.map((r) => r.student_id))];
    const byId = new Map<string, { display_name: string | null; email: string | null }>();
    if (ids.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id,display_name,email").in("id", ids);
      (profs ?? []).forEach((pr) => byId.set(pr.id, { display_name: pr.display_name, email: pr.email }));
    }
    setEnrolments(rows.map((r) => ({ ...r, profiles: byId.get(r.student_id) ?? null })));
    setPayments(((p.data ?? []) as unknown) as Payment[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!ready) return;
    load();
    const ch = supabase
      .channel("admin-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "enrollments" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const needle = q.trim().toLowerCase();
  const match = (...vals: (string | null | undefined)[]) =>
    !needle || vals.some((v) => (v ?? "").toLowerCase().includes(needle));

  const fEnrolments = useMemo(
    () => enrolments.filter((r) => match(r.courses?.title, r.profiles?.display_name, r.profiles?.email, r.status)),
    [enrolments, needle],
  );
  const fPayments = useMemo(
    () =>
      payments
        .filter((r) => payFilter === "all" || r.status === payFilter)
        .filter((r) => match(r.order_id, r.payment_id, r.customer_email, r.purpose)),
    [payments, payFilter, needle],
  );

  const paidRevenue = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount_inr, 0);

  const stats = [
    { label: "Course enrolments", value: enrolments.length, icon: GraduationCap, hint: `${enrolments.filter((e) => e.progress_percent >= 100).length} completed` },
    { label: "Payments", value: payments.length, icon: CreditCard, hint: `${payments.filter((p) => p.status === "paid").length} paid` },
    { label: "Revenue collected", value: inr(paidRevenue), icon: IndianRupee, hint: "Razorpay verified" },
  ];

  if (!ready) return null;

  return (
    <>
      <Seo title="Admin Dashboard — SS TECH SERVICES" description="Live admin overview of course enrolments and payments." path="/admin" noindex />
      <section className="container mx-auto container-px section-py">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Live counts for course enrolments and payments.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-gradient-accent border-0"><Link to="/admin/users">Users &amp; access</Link></Button>
            <Button variant="outline" asChild><Link to="/lms/manage">Course manager</Link></Button>
            <Button variant="outline" asChild><Link to="/lms/activity">Activity log</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/email-health">Email health</Link></Button>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {stats.map((s) => (
            <Card key={s.label} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <s.icon className="h-5 w-5 text-accent" />
              </div>
              <p className="font-display text-3xl font-bold text-primary mt-2">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>
            </Card>
          ))}
        </div>

        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, email, reference, course…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <Tabs defaultValue="enrolments">
          <TabsList className="mb-4">
            <TabsTrigger value="enrolments">Enrolments ({fEnrolments.length})</TabsTrigger>
            <TabsTrigger value="payments">Payments ({fPayments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="enrolments">
            <Card className="divide-y">
              {fEnrolments.length === 0 && <p className="p-5 text-sm text-muted-foreground">No enrolments found.</p>}
              {fEnrolments.map((e) => (
                <div key={e.id} className="p-4 flex flex-wrap items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-primary truncate">{e.courses?.title ?? "Course"}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.profiles?.display_name ?? e.profiles?.email ?? "Student"} · {new Date(e.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{e.progress_percent}%</span>
                    <Badge variant="secondary">{e.status}</Badge>
                  </div>
                </div>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <div className="flex flex-wrap gap-2 mb-3">
              {["all", "created", "paid", "failed"].map((s) => (
                <Button key={s} size="sm" variant={payFilter === s ? "default" : "outline"} onClick={() => setPayFilter(s)}>
                  {s === "all" ? "All" : s}
                </Button>
              ))}
            </div>
            <Card className="divide-y">
              {fPayments.length === 0 && <p className="p-5 text-sm text-muted-foreground">No payments found.</p>}
              {fPayments.map((p) => (
                <div key={p.id} className="p-4 flex flex-wrap items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-primary truncate">{p.purpose} · {p.payment_id ?? p.order_id}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.customer_email ?? "—"} · {new Date(p.created_at).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{inr(p.amount_inr)}</span>
                    <Badge variant={p.status === "paid" ? "default" : "outline"}>{p.status}</Badge>
                  </div>
                </div>
              ))}
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
