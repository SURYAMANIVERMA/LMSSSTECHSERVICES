import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { JOBS, TESTIMONIALS } from "@/data/site";
import { Briefcase, MapPin, Building2, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/Section";
import { Link } from "react-router-dom";

export default function Placement() {
  return (
    <>
      <PageHero eyebrow="Placement Cell" title={<>Where talent <span className="text-accent">meets opportunity.</span></>} sub="A dedicated placement cell with 120+ hiring partners, mock interviews, profile building and lifetime support." />
      <section className="py-16 bg-secondary/40 border-b border-border">
        <div className="container mx-auto container-px grid grid-cols-2 md:grid-cols-4 gap-8">
          <Stat value="95%" label="Placement Rate" />
          <Stat value="₹3.6 LPA" label="Avg. Package" />
          <Stat value="₹14 LPA" label="Highest Package" />
          <Stat value="120+" label="Hiring Partners" />
        </div>
      </section>
      <section className="section-py container mx-auto container-px">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-bold tracking-[0.25em] text-accent uppercase mb-2">Job Board</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">Current openings</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {JOBS.map(j => (
            <Card key={j.title} className="p-6 border-border hover:shadow-elegant transition flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-primary">{j.title}</h3>
                  <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-accent"/>{j.company}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-accent"/>{j.location}</span>
                    <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-accent"/>{j.exp}</span>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-semibold whitespace-nowrap">{j.type}</span>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-5 self-start"><Link to="/contact">Apply now <ArrowRight className="ml-1.5 h-3.5 w-3.5"/></Link></Button>
            </Card>
          ))}
        </div>
      </section>
      <section className="section-py bg-gradient-dark text-primary-foreground">
        <div className="container mx-auto container-px">
          <div className="text-xs font-bold tracking-[0.25em] text-accent uppercase mb-3 text-center">Alumni Testimonials</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">Placed and thriving</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="glass rounded-2xl p-6">
                <div className="flex gap-1 mb-3">{[...Array(5)].map((_,i)=><Star key={i} className="h-4 w-4 fill-accent text-accent"/>)}</div>
                <p className="text-primary-foreground/90">"{t.text}"</p>
                <div className="mt-4 font-semibold">{t.name} <span className="text-primary-foreground/60 font-normal text-sm">— {t.role}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}