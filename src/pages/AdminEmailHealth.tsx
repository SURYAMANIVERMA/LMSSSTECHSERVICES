import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLmsAuth } from "@/hooks/useLmsAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import { toast } from "@/hooks/use-toast";
import { MailCheck, RefreshCw, ArrowLeft, ShieldCheck, AlertTriangle } from "lucide-react";

type Event = {
  id: string;
  email_type: string;
  recipient_email: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  failed: "bg-destructive/15 text-destructive",
  suppressed: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

const HOOK_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/auth-email-hook/health`;

export default function AdminEmailHealth() {
  const nav = useNavigate();
  const { user, loading, isAdmin } = useLmsAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [hook, setHook] = useState<{ ok: boolean; detail: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav("/admin/auth?next=/admin/email-health", { replace: true });
  }, [loading, user, nav]);

  const load = useCallback(async () => {
    setBusy(true);
    const [{ data, error }, probe] = await Promise.all([
      supabase
        .from("email_health_events")
        .select("id,email_type,recipient_email,status,error_message,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      fetch(HOOK_URL)
        .then(async (r) => ({ ok: r.ok, detail: r.ok ? "Deployed and responding" : `HTTP ${r.status}` }))
        .catch(() => ({ ok: false, detail: "Not reachable" })),
    ]);
    if (error) toast({ title: "Could not load logs", description: error.message, variant: "destructive" });
    setEvents((data ?? []) as Event[]);
    setHook(probe);
    setBusy(false);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (loading) return null;

  if (!isAdmin) {
    return (
      <section className="container mx-auto container-px section-py">
        <Card className="p-8 max-w-lg mx-auto text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-3" />
          <h1 className="font-display text-xl font-bold text-primary mb-2">Admins only</h1>
          <p className="text-sm text-muted-foreground">
            This page shows email delivery data and is restricted to administrators.
          </p>
        </Card>
      </section>
    );
  }

  const sent = events.filter((e) => e.status === "sent").length;
  const failed = events.filter((e) => e.status === "failed").length;

  return (
    <>
      <Seo
        title="Email Health — SS TECH SERVICES Admin"
        description="Admin dashboard showing authentication email hook status and recent email delivery logs."
        path="/admin/email-health"
        noindex
      />
      <section className="container mx-auto container-px section-py">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <Link to="/admin/tickets" className="text-xs text-muted-foreground hover:text-accent inline-flex items-center gap-1 mb-2">
              <ArrowLeft className="h-3 w-3" /> Back to admin
            </Link>
            <h1 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
              <MailCheck className="h-6 w-6 text-accent" /> Email health
            </h1>
          </div>
          <Button variant="outline" onClick={load} disabled={busy}>
            <RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Auth email hook</p>
            <p className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className={`h-5 w-5 ${hook?.ok ? "text-emerald-500" : "text-destructive"}`} />
              {hook ? (hook.ok ? "Healthy" : "Problem") : "Checking…"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{hook?.detail ?? ""}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Delivered (last 100)</p>
            <p className="text-2xl font-bold text-primary">{sent}</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Failed (last 100)</p>
            <p className="text-2xl font-bold text-destructive">{failed}</p>
          </Card>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold text-primary">Recent email activity</h2>
            <p className="text-xs text-muted-foreground">Sender domain: notify.sstechservices.org</p>
          </div>
          {events.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No email activity recorded yet. Trigger a signup confirmation or password reset to see entries here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Recipient</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} className="border-t">
                      <td className="px-5 py-3">{e.email_type}</td>
                      <td className="px-5 py-3">{e.recipient_email ?? "—"}</td>
                      <td className="px-5 py-3">
                        <Badge className={STATUS_STYLE[e.status] ?? "bg-muted text-foreground"} variant="secondary">
                          {e.status}
                        </Badge>
                        {e.error_message && (
                          <span className="block text-xs text-destructive mt-1">{e.error_message}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </>
  );
}
