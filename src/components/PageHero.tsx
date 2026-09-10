import { ReactNode } from "react";

export default function PageHero({
  eyebrow,
  title,
  sub,
  children,
  image,
  imageAlt = "",
  live,
}: {
  eyebrow?: string;
  title: ReactNode;
  sub?: string;
  children?: ReactNode;
  image?: string;
  imageAlt?: string;
  live?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
      {image && (
        <>
          <img
            src={image}
            alt={imageAlt}
            width={1600}
            height={900}
            className="absolute inset-0 h-full w-full object-cover opacity-35 animate-ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="h-16 w-full bg-gradient-to-b from-transparent via-accent/25 to-transparent animate-scan" />
          </div>
        </>
      )}
      <div className="absolute inset-0 opacity-20 animate-grid [background-image:radial-gradient(circle_at_25%_25%,white_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent/30 blur-3xl animate-float" />
      <div className="relative container mx-auto container-px py-20 md:py-28">
        {live && (
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase mb-5">
            <span className="h-2 w-2 rounded-full bg-accent live-dot" /> {live}
          </div>
        )}
        {eyebrow && <div className="text-xs font-bold tracking-[0.3em] text-accent uppercase mb-4">{eyebrow}</div>}
        <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight max-w-4xl">{title}</h1>
        {sub && <p className="mt-5 text-lg md:text-xl text-primary-foreground/85 max-w-2xl leading-relaxed">{sub}</p>}
        {children}
      </div>
    </section>
  );
}