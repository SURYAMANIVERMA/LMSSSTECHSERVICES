import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { IT_SERVICES } from "@/data/site";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Services() {
  return (
    <>
      <PageHero eyebrow="IT Services" title={<>Enterprise infrastructure, <span className="text-accent">engineered right.</span></>} sub="From a single rack to multi-region cloud platforms — we design, deploy and operate the systems your business runs on." />
      <section className="section-py container mx-auto container-px">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {IT_SERVICES.map((s) => (
            <Card key={s.title} className="p-7 border-border hover:border-accent/50 hover:shadow-elegant transition group">
              <div className="h-12 w-12 rounded-lg bg-gradient-brand grid place-items-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-primary mb-2">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="section-py bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto container-px text-center max-w-3xl">
          <h2 className="font-display text-3xl md:text-5xl font-bold">Need a custom IT solution?</h2>
          <p className="mt-4 text-primary-foreground/85 text-lg">Get a free consultation with our enterprise architects.</p>
          <Button asChild size="lg" className="mt-8 bg-gradient-accent border-0 shadow-accent"><Link to="/contact">Request a Quote <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>
    </>
  );
}