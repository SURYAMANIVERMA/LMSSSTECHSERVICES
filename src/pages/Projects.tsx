import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { PROJECTS } from "@/data/site";
import { Building2, Cpu } from "lucide-react";

export default function Projects() {
  return (
    <>
      <PageHero eyebrow="Projects" title={<>Mission-critical work, <span className="text-accent">delivered.</span></>} sub="A snapshot of enterprise engagements we are proud of — across BFSI, government, healthcare and education." />
      <section className="section-py container mx-auto container-px">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROJECTS.map(p => (
            <Card key={p.title} className="overflow-hidden border-border hover:shadow-elegant transition group">
              <div className="h-32 bg-gradient-hero relative overflow-hidden">
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(45deg,white_1px,transparent_1px)] [background-size:14px_14px]" />
                <Cpu className="absolute right-4 bottom-4 h-12 w-12 text-white/40 group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-2"><Building2 className="h-3.5 w-3.5"/>{p.client}</div>
                <h3 className="font-display text-lg font-bold text-primary mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                <div className="mt-4 text-xs font-semibold text-primary/70">{p.tech}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}