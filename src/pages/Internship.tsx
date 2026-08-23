import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { INTERNSHIPS } from "@/data/site";
import InquiryForm from "@/components/InquiryForm";
import { Calendar, IndianRupee, CheckCircle2 } from "lucide-react";

export default function Internship() {
  return (
    <>
      <PageHero eyebrow="Internship Program" title={<>Real projects. <span className="text-accent">Real experience.</span></>} sub="Hands-on internships with stipend, mentor reviews and a verifiable certificate." />
      <section className="section-py container mx-auto container-px">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INTERNSHIPS.map(i => (
            <Card key={i.title} className="p-6 border-border hover:shadow-elegant transition">
              <h3 className="font-display text-lg font-bold text-primary">{i.title}</h3>
              <div className="mt-3 text-sm text-muted-foreground flex flex-col gap-1">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-accent"/>{i.duration}</span>
                <span className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-accent"/>{i.stipend}/month</span>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-foreground">
                {["Live industry mentor","2 capstone projects","Internship certificate"].map(t => (
                  <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-accent"/>{t}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>
      <section className="section-py bg-secondary/40 border-y border-border">
        <div className="container mx-auto container-px grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">Apply for an internship</h2>
            <p className="mt-3 text-muted-foreground">Tell us your domain of interest. Selections happen on a rolling basis.</p>
          </div>
          <Card className="p-8 shadow-elegant"><InquiryForm /></Card>
        </div>
      </section>
    </>
  );
}