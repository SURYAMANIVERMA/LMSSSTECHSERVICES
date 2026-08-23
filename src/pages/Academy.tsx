import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { COURSE_CATEGORIES, ALL_COURSES } from "@/data/site";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { Search, BookOpen, Clock, Award } from "lucide-react";
import InquiryForm from "@/components/InquiryForm";
import cyberImg from "@/assets/cybersecurity.jpg";
import aiImg from "@/assets/ai-ml.jpg";
import cloudImg from "@/assets/cloud-devops.jpg";
import robotImg from "@/assets/robot.jpg";

const CATEGORY_IMAGES: Record<string, string> = {
  "Cyber Security & SOC": cyberImg,
  "Data & AI": aiImg,
  "Cloud & DevOps": cloudImg,
  "Mobile Development": robotImg,
};

export default function Academy() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const filtered = useMemo(() => {
    return ALL_COURSES.filter(c => (cat === "All" || c.category === cat) && c.name.toLowerCase().includes(q.toLowerCase()));
  }, [q, cat]);

  return (
    <>
      <PageHero eyebrow="Training Academy" title={<>30+ programs. <span className="text-accent">One outcome — your dream job.</span></>} sub="Industry-aligned curriculum, live mentor sessions and end-to-end placement support." />

      {/* Visual category strip */}
      <section className="container mx-auto container-px pt-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { img: cyberImg, label: "Cyber Security", tag: "Ethical Hacking · SOC · Wazuh" },
            { img: aiImg, label: "AI & Machine Learning", tag: "Python · ML · Deep Learning" },
            { img: cloudImg, label: "Cloud & DevOps", tag: "AWS · Azure · Kubernetes" },
            { img: robotImg, label: "Robotic & Mobile", tag: "Android · Flutter · IoT" },
          ].map(c => (
            <div key={c.label} className="group relative overflow-hidden rounded-xl border border-border aspect-[4/5]">
              <img src={c.img} alt={c.label} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground">
                <div className="text-[10px] tracking-[0.2em] text-accent font-bold uppercase">{c.tag}</div>
                <div className="font-display text-lg font-bold">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-py container mx-auto container-px">
        <div className="mb-8 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search courses…" value={q} onChange={e => setQ(e.target.value)} className="pl-10 h-11" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={cat === "All" ? "default" : "outline"} onClick={() => setCat("All")}>All</Button>
            {COURSE_CATEGORIES.map(c => (
              <Button key={c.name} size="sm" variant={cat === c.name ? "default" : "outline"} onClick={() => setCat(c.name)}>{c.name}</Button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => (
            <Card key={c.name} className="overflow-hidden border-border hover:shadow-elegant hover:border-accent/50 transition group">
              {CATEGORY_IMAGES[c.category] && (
                <div className="relative h-32 overflow-hidden">
                  <img src={CATEGORY_IMAGES[c.category]} alt={c.category} loading="lazy" className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-accent font-semibold mb-2">
                  <BookOpen className="h-3.5 w-3.5" /> {c.category}
                </div>
                <h3 className="font-display text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors">{c.name}</h3>
                <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 6-12 weeks</span>
                  <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> Certified</span>
                </div>
                <Button size="sm" variant="outline" className="w-full">Enquire about {c.name.length > 18 ? "this course" : c.name}</Button>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No courses match your search.</p>}
        </div>
      </section>
      <section className="section-py bg-secondary/40 border-y border-border">
        <div className="container mx-auto container-px grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="text-xs font-bold tracking-[0.25em] text-accent uppercase mb-3">Enroll Now</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">Student Registration</h2>
            <p className="mt-3 text-muted-foreground text-lg">Fill the form and our counsellor will help you choose the right course, batch and payment option.</p>
            <ul className="mt-6 space-y-2 text-sm text-foreground">
              <li>✅ EMI starting ₹2,499/month</li>
              <li>✅ Scholarship up to 30% for early enrolment</li>
              <li>✅ 100% placement assistance</li>
              <li>✅ Live + recorded sessions</li>
            </ul>
          </div>
          <Card className="p-8 shadow-elegant"><InquiryForm /></Card>
        </div>
      </section>
    </>
  );
}