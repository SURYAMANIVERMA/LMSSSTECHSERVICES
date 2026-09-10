import { useMemo, useState } from "react";
import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, MapPin, ArrowRight, Search, GraduationCap } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { OPENINGS, type Opening } from "@/data/site";
import Seo from "@/components/Seo";
import careers from "@/assets/careers.jpg";
import LiveMedia, { mediaFor } from "@/components/LiveMedia";

const LOCATIONS = ["All locations", ...Array.from(new Set(OPENINGS.map((o) => o.loc)))];

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(120),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  message: z.string().trim().max(800).optional(),
});

function ApplyForm({ job, onDone }: { job: Opening; onDone: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      return setErrors(errs);
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.from("inquiries").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      service: `Job Application — ${job.title} (${job.loc})`,
      message: parsed.data.message?.trim() || null,
    });
    setLoading(false);
    if (error) {
      return toast({
        title: "Could not send your application",
        description: `${error.message} — please email your CV to info@sstechservices.org instead.`,
        variant: "destructive",
      });
    }
    toast({ title: "Application received", description: `Our HR team will contact you about ${job.title} within 3 working days.` });
    onDone();
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ap-name">Full name</Label>
          <Input id="ap-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor="ap-phone">Phone</Label>
          <Input id="ap-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 9XXXXXXXXX" />
          {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="ap-email">Email</Label>
        <Input id="ap-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
      </div>
      <div>
        <Label htmlFor="ap-message">Experience summary / CV link (optional)</Label>
        <Textarea
          id="ap-message"
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Years of experience, key skills, notice period, and a link to your CV (Google Drive / LinkedIn)"
        />
      </div>
      <Button type="submit" disabled={loading} className="bg-gradient-accent border-0">
        {loading ? "Sending…" : "Submit application"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Applications reach the same team that handles our contact enquiries — you can also email info@sstechservices.org or call +91 8808227885.
      </p>
    </form>
  );
}

export default function Careers() {
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("All locations");
  const [apply, setApply] = useState<Opening | null>(null);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return OPENINGS.filter((o) => {
      const locOk = loc === "All locations" || o.loc === loc;
      const text = `${o.title} ${o.dept} ${o.desc} ${o.skills.join(" ")} ${o.type}`.toLowerCase();
      return locOk && (term === "" || text.includes(term));
    });
  }, [q, loc]);

  return (
    <>
      <Seo
        title="Careers & Trainer Jobs in Lucknow | SS TECH SERVICES"
        description="Open roles at SS TECH SERVICES — cyber security trainers, DevOps and network engineers, developers and internships in Lucknow, hybrid and remote. Apply online in minutes."
        path="/careers"
      />
      <PageHero
        image={careers}
        imageAlt="Team interview at SS TECH SERVICES office"
        live="We are hiring now"
        eyebrow="Careers"
        title={<>Build the next generation of <span className="text-accent">tech talent.</span></>}
        sub="Join SS TECH SERVICES — work on enterprise projects by day, mentor future engineers by evening."
      />
      <section className="section-py container mx-auto container-px">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input aria-label="Search open roles" className="pl-9" placeholder="Search roles or skills…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={loc} onValueChange={setLoc}>
            <SelectTrigger className="md:w-64" aria-label="Filter by location"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground mb-6">{list.length} open {list.length === 1 ? "role" : "roles"}</p>

        {list.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">
            No roles match your filters right now. Send your CV to info@sstechservices.org and we will keep it on file.
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {list.map((r) => (
              <Card key={r.slug} className="group overflow-hidden border-border hover:shadow-elegant transition flex flex-col">
                <LiveMedia media={mediaFor(`${r.title} ${r.dept}`)} label="Hiring" className="h-36" />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-bold text-primary">{r.title}</h3>
                    <Badge variant="secondary" className="shrink-0">{r.dept}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-4">
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-accent" />{r.loc}</span>
                    <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-accent" />{r.type}</span>
                    <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-accent" />{r.exp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 flex-1">{r.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.skills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                  </div>
                  <Button size="sm" className="mt-5 self-start bg-gradient-accent border-0" onClick={() => setApply(r)}>
                    Apply now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!apply} onOpenChange={(o) => !o && setApply(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {apply && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl text-primary">Apply — {apply.title}</DialogTitle>
                <DialogDescription>{apply.loc} · {apply.type} · {apply.exp}</DialogDescription>
              </DialogHeader>
              <ApplyForm job={apply} onDone={() => setApply(null)} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
