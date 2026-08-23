import { ReactNode } from "react";

export function SectionHeader({ eyebrow, title, sub, center = true }: { eyebrow?: string; title: ReactNode; sub?: string; center?: boolean }) {
  return (
    <div className={`max-w-3xl ${center ? "mx-auto text-center" : ""} mb-12`}>
      {eyebrow && <div className="inline-block text-xs font-bold tracking-[0.25em] text-accent uppercase mb-3">{eyebrow}</div>}
      <h2 className="font-display text-3xl md:text-5xl font-bold text-primary leading-tight">{title}</h2>
      {sub && <p className="mt-4 text-muted-foreground text-lg leading-relaxed">{sub}</p>}
    </div>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl md:text-5xl font-bold gradient-text">{value}</div>
      <div className="text-sm md:text-base text-muted-foreground mt-1">{label}</div>
    </div>
  );
}