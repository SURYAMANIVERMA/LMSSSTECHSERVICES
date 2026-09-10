import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/Section";
import { Target, Eye, Heart, Sparkles } from "lucide-react";
import Seo from "@/components/Seo";
import about from "@/assets/about.jpg";

export default function About() {
  return (
    <>
      <Seo title="About SS TECH SERVICES | Tech Training Academy, Lucknow" description="Learn about SS TECH SERVICES — a Lucknow-based tech training academy and learning platform for Cyber Security, Cloud, DevOps, Full Stack and Data/AI." path="/about" />
      <PageHero image={about} imageAlt="SS TECH SERVICES engineering team at work" live="2000+ students trained" eyebrow="About Us" title={<>We build <span className="text-accent">careers</span> in tech.</>} sub="SS TECH SERVICES is a Lucknow-based training academy and learning platform on a mission to bridge the talent gap in India's tech industry." />
      <section className="section-py container mx-auto container-px">
        <h2 className="sr-only">Our mission, vision and values</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Target, title: "Our Mission", text: "Empower 10,000+ learners with industry-ready skills and connect them to meaningful careers in technology." },
            { icon: Eye, title: "Our Vision", text: "To be India's most trusted academy for outcome-driven, project-based tech training." },
            { icon: Heart, title: "Our Values", text: "Integrity, excellence, mentorship and a relentless focus on student & client success." },
          ].map(({ icon: Icon, title, text }) => (
            <Card key={title} className="p-7 border-border hover:shadow-elegant transition">
              <div className="h-12 w-12 rounded-lg bg-gradient-brand grid place-items-center mb-4"><Icon className="h-6 w-6 text-white" /></div>
              <h3 className="font-display text-xl font-bold text-primary mb-2">{title}</h3>
              <p className="text-muted-foreground leading-relaxed">{text}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="py-16 bg-secondary/40 border-y border-border">
        <div className="container mx-auto container-px grid grid-cols-2 md:grid-cols-4 gap-8">
          <Stat value="2,500+" label="Students Trained" />
          <Stat value="120+" label="Hiring Partners" />
          <Stat value="50+" label="Enterprise Clients" />
          <Stat value="8+ Yrs" label="Industry Experience" />
        </div>
      </section>
      <section className="section-py container mx-auto container-px max-w-4xl">
        <div className="text-xs font-bold tracking-[0.25em] text-accent uppercase mb-3">Our Story</div>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-6">From a small networking lab to a full-stack tech enterprise.</h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>SS TECH SERVICES was founded with a single belief — that quality tech training should be accessible from Tier-2 India, not just the metros. Today our learners come from across the country, build mentor-reviewed capstone projects and land roles at top product and services companies.</p>
          <p>Headquartered in Lucknow's premier business hub, our team blends decades of hands-on experience in networking, Linux, cloud, DevOps and cyber security. Every program we run is taught by practitioners who solve these problems in production every day.</p>
        </div>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent/10 text-accent px-4 py-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4" /> Trusted since 2017
        </div>
      </section>
    </>
  );
}