import { ReactNode } from "react";

export default function PageHero({ eyebrow, title, sub, children }: { eyebrow?: string; title: ReactNode; sub?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_25%_25%,white_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
      <div className="relative container mx-auto container-px py-20 md:py-28">
        {eyebrow && <div className="text-xs font-bold tracking-[0.3em] text-accent uppercase mb-4">{eyebrow}</div>}
        <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight max-w-4xl">{title}</h1>
        {sub && <p className="mt-5 text-lg md:text-xl text-primary-foreground/85 max-w-2xl leading-relaxed">{sub}</p>}
        {children}
      </div>
    </section>
  );
}