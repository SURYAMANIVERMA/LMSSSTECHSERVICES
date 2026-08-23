import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ROLES = [
  { title: "Senior Cyber Security Trainer", loc: "Lucknow", type: "Full-time" },
  { title: "DevOps Engineer (Trainer + Practitioner)", loc: "Lucknow / Hybrid", type: "Full-time" },
  { title: "Linux & RHCE Trainer", loc: "Lucknow", type: "Full-time" },
  { title: "Full Stack Developer (MERN)", loc: "Remote / Lucknow", type: "Full-time" },
  { title: "Network Engineer (L2)", loc: "Lucknow", type: "Full-time" },
  { title: "Business Development Executive", loc: "Lucknow", type: "Full-time" },
];

export default function Careers() {
  return (
    <>
      <PageHero eyebrow="Careers" title={<>Build the next generation of <span className="text-accent">tech talent.</span></>} sub="Join SS TECH SERVICES & ACADEMY — work on enterprise projects by day, mentor future engineers by evening." />
      <section className="section-py container mx-auto container-px">
        <div className="grid md:grid-cols-2 gap-5">
          {ROLES.map(r => (
            <Card key={r.title} className="p-6 border-border hover:shadow-elegant transition">
              <h3 className="font-display text-lg font-bold text-primary">{r.title}</h3>
              <div className="mt-2 text-sm text-muted-foreground flex flex-wrap gap-4">
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-accent"/>{r.loc}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-accent"/>{r.type}</span>
              </div>
              <Button asChild size="sm" variant="outline" className="mt-5">
                <Link to="/contact">Apply <ArrowRight className="ml-1.5 h-3.5 w-3.5"/></Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}