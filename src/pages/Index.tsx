import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, GraduationCap, Briefcase, Award, Cloud, Code2, Network, Cpu, Star, CheckCircle2 } from "lucide-react";
import hero from "@/assets/hero.jpg";
import academy from "@/assets/academy.jpg";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader, Stat } from "@/components/Section";
import { IT_SERVICES, COURSE_CATEGORIES, TESTIMONIALS, SITE } from "@/data/site";
import InquiryForm from "@/components/InquiryForm";

const ICONS: Record<string, any> = { Cloud, Code2, Network, Cpu, ShieldCheck };

export default function Index() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <img src={hero} alt="Enterprise cyber security data center" className="absolute inset-0 h-full w-full object-cover opacity-30" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-transparent" />
        <div className="relative container mx-auto container-px py-24 md:py-36">
          <div className="max-w-3xl animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold tracking-wider mb-6">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              ENTERPRISE IT · ACADEMY · PLACEMENT
            </div>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05]">
              {SITE.tagline.split("•").map((w, i) => (
                <span key={i} className="inline-block mr-3">
                  {w.trim()}{i < 3 && <span className="text-accent">•</span>}
                </span>
              ))}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
              SS TECH SERVICES & ACADEMY delivers enterprise-grade IT services and industry-aligned tech training — from Cyber Security and Cloud to Full-Stack and AI. Real labs, real mentors, real placements.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-accent border-0 shadow-accent text-base">
                <Link to="/academy">Explore Courses <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary">
                <Link to="/services">IT Services</Link>
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-xl">
              <div><div className="font-display text-3xl font-bold text-accent">2,500+</div><div className="text-xs text-primary-foreground/70 mt-1">Students Trained</div></div>
              <div><div className="font-display text-3xl font-bold text-accent">95%</div><div className="text-xs text-primary-foreground/70 mt-1">Placement Rate</div></div>
              <div><div className="font-display text-3xl font-bold text-accent">120+</div><div className="text-xs text-primary-foreground/70 mt-1">Hiring Partners</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-border bg-secondary/40">
        <div className="container mx-auto container-px py-6 flex flex-wrap justify-around gap-6 text-sm font-semibold text-muted-foreground">
          {["Red Hat Aligned", "AWS Curriculum", "Microsoft Azure", "Cisco Networking", "EC-Council", "Wazuh • Splunk"].map(p => (
            <span key={p} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> {p}</span>
          ))}
        </div>
      </section>

      {/* IT SERVICES */}
      <section className="section-py">
        <div className="container mx-auto container-px">
          <SectionHeader eyebrow="What We Do" title={<>Enterprise <span className="gradient-text-accent">IT Services</span></>} sub="Design, deploy and operate critical infrastructure — backed by certified engineers and 24x7 support." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {IT_SERVICES.map((s, i) => (
              <Card key={s.title} className="group p-7 border-border hover:border-accent/50 hover:shadow-elegant transition-all">
                <div className="h-12 w-12 rounded-lg bg-gradient-brand grid place-items-center mb-4 group-hover:scale-110 transition-transform">
                  <Network className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-display text-xl font-bold text-primary mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg"><Link to="/services">View all services <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      {/* ACADEMY */}
      <section className="section-py bg-gradient-dark text-primary-foreground relative overflow-hidden">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl" />
        <div className="container mx-auto container-px relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-bold tracking-[0.25em] text-accent uppercase mb-3">Training Academy</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">Master in-demand tech.<br/><span className="gradient-text-accent">Get hired.</span></h2>
            <p className="mt-5 text-primary-foreground/80 text-lg leading-relaxed">
              30+ industry-grade programs across Cyber Security, Cloud, DevOps, Programming, Data & AI — taught by practitioners, in real labs, with end-to-end placement support.
            </p>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
              {["Live mentor-led classes", "24×7 cyber range & cloud labs", "Industry certifications", "Capstone projects", "Resume & interview prep", "Dedicated placement cell"].map(f => (
                <li key={f} className="flex items-center gap-2 text-primary-foreground/85"><CheckCircle2 className="h-4 w-4 text-accent" /> {f}</li>
              ))}
            </ul>
            <div className="mt-8 flex gap-3">
              <Button asChild size="lg" className="bg-gradient-accent border-0 shadow-accent"><Link to="/academy">Browse Courses</Link></Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white hover:text-primary"><Link to="/lms">LMS Login</Link></Button>
            </div>
          </div>
          <div className="relative">
            <img src={academy} alt="Students at SS TECH Academy" className="rounded-2xl shadow-glow" width={1280} height={800} loading="lazy" />
            <div className="absolute -bottom-6 -left-6 bg-white text-primary rounded-xl p-4 shadow-elegant max-w-[200px]">
              <Award className="h-6 w-6 text-accent mb-2" />
              <div className="font-bold text-sm">Industry Certified</div>
              <div className="text-xs text-muted-foreground">RHCSA · CCNA · AWS · CEH</div>
            </div>
          </div>
        </div>
      </section>

      {/* COURSE CATEGORIES */}
      <section className="section-py">
        <div className="container mx-auto container-px">
          <SectionHeader eyebrow="Course Catalogue" title={<>Pick your <span className="gradient-text">career track</span></>} sub="Choose from 30+ programs across 9 high-growth tech domains." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {COURSE_CATEGORIES.map(cat => (
              <Card key={cat.name} className="overflow-hidden border-border hover:shadow-elegant transition-all group">
                <div className={`h-2 bg-gradient-to-r ${cat.color}`} />
                <div className="p-6">
                  <h3 className="font-display text-lg font-bold text-primary mb-3">{cat.name}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.courses.map(c => (
                      <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">{c}</span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-secondary/40 border-y border-border">
        <div className="container mx-auto container-px grid grid-cols-2 md:grid-cols-4 gap-8">
          <Stat value="2,500+" label="Students Trained" />
          <Stat value="120+" label="Hiring Partners" />
          <Stat value="30+" label="Certified Courses" />
          <Stat value="8+ Yrs" label="Industry Experience" />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section-py">
        <div className="container mx-auto container-px">
          <SectionHeader eyebrow="Success Stories" title={<>Voices of our <span className="gradient-text-accent">alumni</span></>} />
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map(t => (
              <Card key={t.name} className="p-7 border-border hover:shadow-elegant transition">
                <div className="flex gap-1 mb-3">{[...Array(5)].map((_,i)=><Star key={i} className="h-4 w-4 fill-accent text-accent" />)}</div>
                <p className="text-foreground leading-relaxed">"{t.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-brand grid place-items-center text-white font-bold">{t.name[0]}</div>
                  <div>
                    <div className="font-semibold text-primary">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / INQUIRY */}
      <section className="section-py bg-gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="container mx-auto container-px relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-bold tracking-[0.3em] text-accent uppercase mb-3">Get Started</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold">Talk to a counsellor</h2>
            <p className="mt-4 text-primary-foreground/80 text-lg">Tell us your goal — we'll map the perfect course, schedule and career path.</p>
            <div className="mt-8 space-y-3 text-primary-foreground/85">
              {[
                ["Free 1:1 career counselling"],
                ["EMI options & scholarships"],
                ["Job-guarantee programs"],
              ].map(([t]) => (
                <div key={t} className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-accent" /> {t}</div>
              ))}
            </div>
          </div>
          <Card className="p-8 bg-background text-foreground shadow-elegant">
            <InquiryForm />
          </Card>
        </div>
      </section>
    </>
  );
}
