import { Link } from "react-router-dom";
import { ArrowRight, Award, Star, CheckCircle2, GraduationCap, Users, BadgeCheck, Briefcase } from "lucide-react";
import hero from "@/assets/hero.jpg";
import academy from "@/assets/academy.jpg";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader, Stat } from "@/components/Section";
import { TESTIMONIALS, SITE, TRAINING_TRACKS, PROJECTS } from "@/data/site";
import InquiryForm from "@/components/InquiryForm";
import Seo from "@/components/Seo";
import LiveMedia, { mediaFor } from "@/components/LiveMedia";

export default function Index() {
  return (
    <>
      <Seo
        title="SS TECH SERVICES — Tech Training Academy & LMS, Lucknow"
        description="Learn Cyber Security, Cloud, DevOps, Full Stack, Data and AI with live mentors, hands-on labs, capstone projects, certification and placement support on the SS TECH SERVICES learning platform."
        path="/"
      />
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <img src={hero} alt="Students learning cyber security in a live lab" className="absolute inset-0 h-full w-full object-cover opacity-30 animate-ken-burns" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-transparent" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="h-20 w-full bg-gradient-to-b from-transparent via-accent/20 to-transparent animate-scan" />
        </div>
        <div className="relative container mx-auto container-px py-24 md:py-36">
          <div className="max-w-3xl animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-semibold tracking-wider mb-6">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              LIVE CLASSES · LABS · PROJECTS · PLACEMENT
            </div>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05]">
              SS TECH SERVICES — <span className="text-accent">Training Academy</span> &amp; Learning Platform
            </h1>
            <div className="mt-4 text-sm font-bold tracking-[0.3em] text-accent uppercase" aria-hidden="true">
              {SITE.tagline}
            </div>
            <p className="mt-6 text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
              Job-ready programs in Cyber Security, Cloud, DevOps, Full Stack, Data and AI — taught by working engineers, with hands-on labs, mentor-reviewed capstone projects, certificates and placement assistance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-accent border-0 shadow-accent text-base">
                <Link to="/lms/courses">Browse Courses <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary">
                <Link to="/lms/auth">Student Login</Link>
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-xl">
              <div><div className="font-display text-3xl font-bold text-accent">30+</div><div className="text-xs text-primary-foreground/70 mt-1">Courses</div></div>
              <div><div className="font-display text-3xl font-bold text-accent">2000+</div><div className="text-xs text-primary-foreground/70 mt-1">Students Trained</div></div>
              <div><div className="font-display text-3xl font-bold text-accent">100%</div><div className="text-xs text-primary-foreground/70 mt-1">Project-Based Learning</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-border bg-secondary/40">
        <div className="container mx-auto container-px py-6 flex flex-wrap justify-around gap-6 text-sm font-semibold text-muted-foreground">
          {["Red Hat Aligned", "AWS & Azure", "CCNA Track", "CEH & SOC Labs", "Kubernetes & DevOps", "MERN Full Stack"].map(p => (
            <span key={p} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" /> {p}</span>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section className="section-py">
        <div className="container mx-auto container-px">
          <SectionHeader eyebrow="Why Learn With Us" title={<>A learning platform built for <span className="gradient-text-accent">placements</span></>} sub="Structured modules, live doubt sessions, real labs and a capstone project in every course." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: GraduationCap, title: "Structured LMS", text: "Modules, lessons, videos, notes and quizzes with progress tracking on every login." },
              { icon: Users, title: "Live Mentors", text: "Working engineers teach live batches and review your assignments personally." },
              { icon: BadgeCheck, title: "Certification", text: "Verified course certificates, downloadable as PDF once your course is complete." },
              { icon: Briefcase, title: "Placement Cell", text: "Resume, mock interviews and referrals to hiring partners after your capstone." },
            ].map(({ icon: Icon, title, text }) => (
              <Card key={title} className="p-6 border-border hover:shadow-elegant transition">
                <Icon className="h-8 w-8 text-accent mb-3" />
                <h3 className="font-display text-lg font-bold text-primary">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TRACKS */}
      <section className="section-py bg-secondary/30 border-y border-border">
        <div className="container mx-auto container-px">
          <SectionHeader eyebrow="Programs" title={<>Popular <span className="gradient-text">learning tracks</span></>} sub="Pick a track, join a live batch, finish with a portfolio project." />
          <div className="flex flex-wrap justify-center gap-3">
            {TRAINING_TRACKS.map(t => (
              <Link key={t} to="/lms/courses" className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-secondary-foreground hover:border-accent hover:text-accent transition">
                {t}
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild size="lg" className="bg-gradient-accent border-0 shadow-accent"><Link to="/lms/courses">View full course catalogue <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      {/* LMS PORTAL */}
      <section className="section-py bg-gradient-dark text-primary-foreground relative overflow-hidden">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl" />
        <div className="container mx-auto container-px relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-bold tracking-[0.25em] text-accent uppercase mb-3">LMS Portal</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">Your courses, progress and<br/><span className="gradient-text-accent">certificates in one place.</span></h2>
            <p className="mt-5 text-primary-foreground/80 text-lg leading-relaxed">
              Log in to continue lessons where you left off, attempt quizzes, submit assignments and download your certificate the moment your course is approved.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-accent border-0 shadow-accent">
                <Link to="/lms">Go to My Learning <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white hover:text-primary">
                <Link to="/lms/auth">Register / Login</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <img src={academy} alt="SS TECH SERVICES learning platform dashboard" className="rounded-2xl shadow-glow" width={1280} height={800} loading="lazy" />
            <div className="absolute -bottom-6 -left-6 bg-white text-primary rounded-xl p-4 shadow-elegant max-w-[200px]">
              <Award className="h-6 w-6 text-accent mb-2" />
              <div className="font-bold text-sm">Certified Trainers</div>
              <div className="text-xs text-muted-foreground">RHCSA · CCNA · AWS · CEH</div>
            </div>
          </div>
        </div>
      </section>

      {/* STUDENT PROJECTS */}
      <section className="section-py">
        <div className="container mx-auto container-px">
          <SectionHeader eyebrow="Capstone Projects" title={<>Projects our <span className="gradient-text-accent">students build</span></>} sub="Every program ends with a mentor-reviewed project you can show in interviews." />
          <div className="grid md:grid-cols-3 gap-6">
            {PROJECTS.slice(0, 3).map(p => (
              <Card key={p.slug} className="overflow-hidden border-border hover:shadow-elegant transition flex flex-col">
                <LiveMedia media={mediaFor(`${p.title} ${p.tech}`)} label="Capstone" className="h-40" />
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-xs font-semibold text-accent">{p.category}</div>
                  <h3 className="font-display text-lg font-bold text-primary mt-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex-1">{p.desc}</p>
                  <div className="mt-4 text-xs font-semibold text-primary/70">{p.tech}</div>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg"><Link to="/projects">See all student projects <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-secondary/40 border-y border-border">
        <div className="container mx-auto container-px grid grid-cols-2 md:grid-cols-4 gap-8">
          <Stat value="2000+" label="Students Trained" />
          <Stat value="30+" label="Courses & Tracks" />
          <Stat value="50+" label="Hiring Partners" />
          <Stat value="8+ Yrs" label="Industry Experience" />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section-py">
        <div className="container mx-auto container-px">
          <SectionHeader eyebrow="Student Stories" title={<>Loved by <span className="gradient-text-accent">learners</span></>} />
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
            <h2 className="font-display text-4xl md:text-5xl font-bold">Talk to a course advisor</h2>
            <p className="mt-4 text-primary-foreground/80 text-lg">Tell us your goal — we'll suggest the right track, batch timing and fee plan.</p>
            <div className="mt-8 space-y-3 text-primary-foreground/85">
              {[
                "Free career counselling session",
                "Flexible batches — weekday, weekend, online",
                "Certificate + placement assistance on completion",
              ].map((t) => (
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
