import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { TICKET_STATUS_META } from "@/data/site";
import { Clock, CheckCircle2, User, Wrench, Search } from "lucide-react";

type Ticket = {
  public_ref: string;
  customer_name: string;
  issue_type: string;
  status: keyof typeof TICKET_STATUS_META;
  engineer_name: string | null;
  created_at: string;
  updated_at: string;
};
type Timeline = { to_status: keyof typeof TICKET_STATUS_META; author_name: string | null; created_at: string };

export default function TrackTicket() {
  const { ref } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(ref || "");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [timeline, setTimeline] = useState<Timeline[]>([]);
  const [loading, setLoading] = useState(false);

  async function load(r: string) {
    if (!r) return;
    setLoading(true);
    const [{ data: t, error: e1 }, { data: tl }] = await Promise.all([
      supabase.rpc("get_ticket_public", { p_ref: r.trim().toUpperCase() }),
      supabase.rpc("get_ticket_timeline_public", { p_ref: r.trim().toUpperCase() }),
    ]);
    setLoading(false);
    if (e1 || !t || (Array.isArray(t) && t.length === 0)) {
      toast({ title: "Ticket not found", description: "Please double-check your ticket ID.", variant: "destructive" });
      setTicket(null);
      return;
    }
    const row = Array.isArray(t) ? t[0] : t;
    setTicket(row as Ticket);
    setTimeline((tl as Timeline[]) || []);
  }

  useEffect(() => {
    if (ref) load(ref);
  }, [ref]);

  // Realtime updates
  useEffect(() => {
    if (!ticket) return;
    const channel = supabase
      .channel(`ticket-${ticket.public_ref}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_tickets" }, payload => {
        const updated = payload.new as any;
        if (updated.public_ref === ticket.public_ref) {
          load(ticket.public_ref);
          toast({ title: "🔔 Status updated", description: `Now: ${TICKET_STATUS_META[updated.status as string]?.label || updated.status}` });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticket?.public_ref]);

  const stepNow = ticket ? TICKET_STATUS_META[ticket.status]?.step ?? 1 : 0;

  return (
    <>
      <PageHero eyebrow="Ticket Tracking" title={<>Track your <span className="text-accent">support ticket</span></>} sub="Enter your ticket ID to see live status updates from our engineers." />
      <section className="section-py container mx-auto container-px max-w-3xl">
        <Card className="p-6 mb-8">
          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); navigate(`/track/${query.trim().toUpperCase()}`); }}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. SS-A1B2C3D4" className="pl-10 h-11 uppercase" />
            </div>
            <Button type="submit" disabled={loading} className="bg-gradient-accent border-0 shadow-accent">Track</Button>
          </form>
        </Card>

        {ticket && (
          <Card className="p-7 shadow-elegant">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
              <div>
                <div className="text-xs text-muted-foreground">TICKET</div>
                <div className="font-display text-2xl font-bold text-primary">{ticket.public_ref}</div>
                <div className="text-sm text-muted-foreground mt-1">Raised by {ticket.customer_name}</div>
              </div>
              <Badge className={`${TICKET_STATUS_META[ticket.status].color} text-white border-0 text-sm px-3 py-1`}>
                {TICKET_STATUS_META[ticket.status].label}
              </Badge>
            </div>

            {/* Progress stepper */}
            <div className="grid grid-cols-4 gap-2 mb-8">
              {[
                { key: "new", label: "Received" },
                { key: "assigned", label: "Assigned" },
                { key: "in_progress", label: "In Progress" },
                { key: "resolved", label: "Resolved" },
              ].map((s, i) => {
                const done = stepNow >= i + 1;
                return (
                  <div key={s.key} className="text-center">
                    <div className={`h-10 w-10 mx-auto rounded-full grid place-items-center text-white font-bold ${done ? "bg-gradient-accent shadow-accent" : "bg-muted text-muted-foreground"}`}>
                      {done ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                    </div>
                    <div className={`text-xs mt-2 font-semibold ${done ? "text-primary" : "text-muted-foreground"}`}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
              <div className="flex items-start gap-2"><Wrench className="h-4 w-4 text-accent mt-0.5" /><div><div className="text-xs text-muted-foreground">Issue</div><div className="font-semibold">{ticket.issue_type}</div></div></div>
              <div className="flex items-start gap-2"><User className="h-4 w-4 text-accent mt-0.5" /><div><div className="text-xs text-muted-foreground">Engineer</div><div className="font-semibold">{ticket.engineer_name || "Not assigned yet"}</div></div></div>
              <div className="flex items-start gap-2"><Clock className="h-4 w-4 text-accent mt-0.5" /><div><div className="text-xs text-muted-foreground">Created</div><div className="font-semibold">{new Date(ticket.created_at).toLocaleString()}</div></div></div>
              <div className="flex items-start gap-2"><Clock className="h-4 w-4 text-accent mt-0.5" /><div><div className="text-xs text-muted-foreground">Last update</div><div className="font-semibold">{new Date(ticket.updated_at).toLocaleString()}</div></div></div>
            </div>

            {timeline.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-primary mb-3">Activity</h3>
                <ol className="relative border-l-2 border-accent/30 pl-5 space-y-4">
                  {timeline.map((t, i) => (
                    <li key={i}>
                      <span className="absolute -left-1.5 h-3 w-3 rounded-full bg-accent" />
                      <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                      <div className="font-semibold text-sm">Status → <span className="text-accent">{TICKET_STATUS_META[t.to_status]?.label || t.to_status}</span></div>
                      {t.author_name && <div className="text-xs text-muted-foreground">by {t.author_name}</div>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>
        )}
      </section>
    </>
  );
}