import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Phone, MessageCircle, Monitor, Wrench, Clock, CheckCircle2, Zap, BellRing, ShieldCheck, MapPin } from "lucide-react";
import { QUICK_SUPPORT_PLANS, QUICK_SUPPORT_ISSUES, SITE } from "@/data/site";
import supportImg from "@/assets/quick-support.jpg";

export default function QuickSupport() {
  const [form, setForm] = useState({ name: "", phone: "", issue: QUICK_SUPPORT_ISSUES[0], detail: "" });
  const [sent, setSent] = useState(false);
  const [ticketRef, setTicketRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast({ title: "Please enter your name and phone", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        issue_type: form.issue,
        detail: form.detail.trim() || null,
      })
      .select("public_ref")
      .single();
    setLoading(false);
    if (error || !data) {
      toast({ title: "Could not create ticket", description: error?.message, variant: "destructive" });
      return;
    }
    setTicketRef(data.public_ref);
    setSent(true);
    toast({
      title: "🔔 Ticket created — " + data.public_ref,
      description: `Hi ${form.name}, our Lucknow team will WhatsApp/call you within 5 minutes.`,
    });
    setTimeout(() => {
      toast({
        title: "💬 Quick Reply from SS TECH Support",
        description: `"Hello ${form.name}, namaste! Your "${form.issue}" request is in our queue. Track it any time using your ticket ID."`,
      });
    }, 2500);
    setForm({ name: "", phone: "", issue: QUICK_SUPPORT_ISSUES[0], detail: "" });
  }

  return (
    <>
      <PageHero
        eyebrow="Quick Support · Lucknow"
        title={<>IT problem? <span className="text-accent">Engineer in 60 minutes.</span></>}
        sub="On-call, on-site or remote — affordable IT support across Lucknow with instant WhatsApp quick-reply notifications."
      />

      {/* Hero strip */}
      <section className="section-py container mx-auto container-px grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <Badge className="bg-gradient-accent border-0 text-white mb-4">⚡ Live now · Avg response under 5 mins</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">
            Affordable, transparent IT help — built for Lucknow homes &amp; businesses.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            From a slow laptop to a down server — call, WhatsApp, or book online. Pay Lucknow market rates, no hidden charges.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-accent border-0 shadow-accent">
              <a href={`tel:${SITE.phoneRaw}`}><Phone className="mr-2 h-4 w-4" /> Call {SITE.phone}</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hi, I need Quick Support in Lucknow.")}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp now
              </a>
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border border-border p-3"><Clock className="h-5 w-5 mx-auto text-accent" /><div className="text-xs mt-1 font-semibold">5 min reply</div></div>
            <div className="rounded-lg border border-border p-3"><MapPin className="h-5 w-5 mx-auto text-accent" /><div className="text-xs mt-1 font-semibold">All Lucknow</div></div>
            <div className="rounded-lg border border-border p-3"><ShieldCheck className="h-5 w-5 mx-auto text-accent" /><div className="text-xs mt-1 font-semibold">No-Fix-No-Fee</div></div>
          </div>
        </div>
        <div className="relative">
          <img src={supportImg} alt="SS TECH quick support engineer with quick-reply notifications" className="rounded-2xl shadow-glow w-full" loading="lazy" />
          <div className="absolute -bottom-5 -left-5 bg-background border border-border rounded-xl p-3 shadow-elegant flex items-center gap-2 animate-fade-up">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-primary">Engineers online · 12</span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section-py bg-secondary/40 border-y border-border">
        <div className="container mx-auto container-px">
          <div className="text-center mb-10">
            <div className="text-xs font-bold tracking-[0.25em] text-accent uppercase mb-2">Lucknow Market Rates</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">Simple, honest pricing</h2>
            <p className="text-muted-foreground mt-2">Pay per visit, per session or get an annual contract — your choice.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {QUICK_SUPPORT_PLANS.map(p => (
              <Card key={p.name} className={`p-7 border-2 transition hover:shadow-elegant ${p.highlight ? "border-accent shadow-accent relative" : "border-border"}`}>
                {p.highlight && (
                  <Badge className="absolute -top-3 right-5 bg-gradient-accent border-0 text-white">Most Popular</Badge>
                )}
                <h3 className="font-display text-xl font-bold text-primary">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold gradient-text">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.unit}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{p.eta}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {p.features.map(f => (
                    <li key={f} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" /><span>{f}</span></li>
                  ))}
                </ul>
                <Button asChild className={`w-full mt-6 ${p.highlight ? "bg-gradient-accent border-0 shadow-accent" : ""}`} variant={p.highlight ? "default" : "outline"}>
                  <a href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`I want to book: ${p.name}`)}`} target="_blank" rel="noopener noreferrer">Book Now</a>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-py container mx-auto container-px">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">How Quick Support works</h2>
          <p className="text-muted-foreground mt-2">Three simple steps — quick-reply notifications keep you informed at every stage.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: BellRing, title: "1. Raise a request", desc: "Use the form, WhatsApp or call. You instantly get a quick-reply notification with ticket ID." },
            { icon: Monitor, title: "2. Remote / On-site", desc: "Engineer connects via AnyDesk in 5 mins, or reaches your Lucknow address in 60–90 mins." },
            { icon: Wrench, title: "3. Fixed & followed-up", desc: "Issue resolved with proof, and a 7-day free follow-up reply on WhatsApp." },
          ].map(s => (
            <Card key={s.title} className="p-6 border-border hover:border-accent/50 hover:shadow-elegant transition">
              <div className="h-12 w-12 rounded-lg bg-gradient-brand grid place-items-center mb-4">
                <s.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-display text-lg font-bold text-primary mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Request form with quick-reply notification */}
      <section className="section-py bg-gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="container mx-auto container-px relative grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="bg-white/15 border-white/20 text-white mb-4"><Zap className="h-3 w-3 mr-1" /> Instant quick-reply enabled</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Raise a support ticket</h2>
            <p className="mt-3 text-primary-foreground/85 text-lg">
              Submit and watch — you'll get a real-time notification on screen and a follow-up WhatsApp from our Lucknow engineer.
            </p>
            <ul className="mt-6 space-y-2 text-primary-foreground/85 text-sm">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Auto-acknowledgement in &lt; 5 seconds</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Engineer name + ETA shared upfront</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Pay only after the issue is fixed</li>
            </ul>
          </div>
          <Card className="p-7 bg-background text-foreground shadow-elegant">
            <form className="grid gap-4" onSubmit={submit}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Your Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Suresh Kumar" /></div>
                <div><Label>Mobile Number</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 9xxxxxxxxx" /></div>
              </div>
              <div>
                <Label>Issue Type</Label>
                <select className="w-full h-10 mt-2 rounded-md border border-input bg-background px-3 text-sm" value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })}>
                  {QUICK_SUPPORT_ISSUES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div><Label>Describe (optional)</Label><Textarea rows={3} value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })} placeholder="e.g. Laptop is showing blue screen since morning" /></div>
              <Button type="submit" size="lg" disabled={loading} className="bg-gradient-accent border-0 shadow-accent">
                <BellRing className="h-4 w-4 mr-2" /> {loading ? "Creating ticket…" : "Send & notify engineer"}
              </Button>
              {sent && ticketRef && (
                <div className="rounded-lg border-2 border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-center">
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">YOUR TICKET ID</div>
                  <div className="font-display text-2xl font-bold text-emerald-700 dark:text-emerald-300 my-1">{ticketRef}</div>
                  <Link to={`/track/${ticketRef}`} className="text-sm text-emerald-700 dark:text-emerald-300 underline">
                    Track status live →
                  </Link>
                </div>
              )}
              <div className="text-xs text-center text-muted-foreground">
                Have a ticket already? <Link to="/track" className="text-accent font-semibold">Track it here</Link>
              </div>
            </form>
          </Card>
        </div>
      </section>
    </>
  );
}