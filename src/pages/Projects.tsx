import { useMemo, useState } from "react";
import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PROJECTS, PROJECT_CATEGORIES, type Project } from "@/data/site";
import { Building2, Search, ArrowRight, CheckCircle2, Target, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import projects from "@/assets/projects.jpg";
import LiveMedia, { mediaFor } from "@/components/LiveMedia";

export default function Projects() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState<Project | null>(null);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return PROJECTS.filter((p) => {
      const catOk = cat === "All" || p.category === cat;
      const text = `${p.title} ${p.client} ${p.tech} ${p.desc} ${p.category} ${p.stack.join(" ")}`.toLowerCase();
      return catOk && (term === "" || text.includes(term));
    });
  }, [q, cat]);

  return (
    <>
      <Seo
        title="Student Capstone Projects | SS TECH SERVICES Training Academy"
        description="Searchable gallery of capstone projects our students build — SOC labs, pentest reports, CI/CD pipelines, MERN portals, ML models and Android apps, with tech stack and outcomes."
        path="/projects"
      />
      <PageHero
        image={projects}
        imageAlt="Cloud architecture visualisation"
        live="Built by our students"
        eyebrow="Student Projects"
        title={<>Learn by <span className="text-accent">building real projects.</span></>}
        sub="Every course ends in a mentor-reviewed capstone project that goes straight into your portfolio."
      />
      <section className="section-py container mx-auto container-px">
        <div className="flex flex-col gap-5 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Search projects"
              placeholder="Search projects, batches or tech…"
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {PROJECT_CATEGORIES.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={cat === c ? "default" : "outline"}
                className={cat === c ? "bg-gradient-accent border-0" : ""}
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">{list.length} of {PROJECTS.length} projects</p>

        {list.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">No projects match your search. Try another keyword or track.</Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((p) => (
              <Card key={p.slug} className="overflow-hidden border-border hover:shadow-elegant transition group flex flex-col">
                <LiveMedia media={mediaFor(`${p.title} ${p.tech}`)} label="Capstone" className="h-40" />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-accent font-semibold"><Building2 className="h-3.5 w-3.5" />{p.client}</div>
                    <Badge variant="secondary">{p.category}</Badge>
                  </div>
                  <h3 className="font-display text-lg font-bold text-primary mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{p.desc}</p>
                  <div className="mt-4 text-xs font-semibold text-primary/70">{p.tech} · {p.year}</div>
                  <Button variant="outline" size="sm" className="mt-5 self-start" onClick={() => setOpen(p)}>
                    View project <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-primary">{open.title}</DialogTitle>
                <DialogDescription>
                  {open.client} · {open.category} · {open.year}
                </DialogDescription>
              </DialogHeader>
              <LiveMedia media={mediaFor(`${open.title} ${open.tech}`)} label="Case study" className="h-44 rounded-lg" />
              <p className="text-sm text-muted-foreground">{open.desc}</p>

              <div>
                <h4 className="font-display font-bold text-primary flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Client requirements</h4>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {open.requirements.map((r) => (
                    <li key={r} className="flex gap-2"><span className="text-accent">•</span>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-display font-bold text-primary flex items-center gap-2"><Layers className="h-4 w-4 text-accent" /> Tech stack</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {open.stack.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                </div>
              </div>

              <div>
                <h4 className="font-display font-bold text-primary flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> Outcomes</h4>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {open.outcomes.map((o) => (
                    <li key={o} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />{o}</li>
                  ))}
                </ul>
              </div>

              <Button asChild className="bg-gradient-accent border-0 mt-2">
                <Link to="/contact" onClick={() => setOpen(null)}>Enrol & build this project <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
