import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { NAV, SITE } from "@/data/site";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-lg">
      <div className="bg-gradient-brand text-primary-foreground text-xs">
        <div className="container mx-auto container-px flex h-9 items-center justify-between">
          <span className="hidden sm:inline">{SITE.tagline}</span>
          <div className="flex items-center gap-4">
            <a href={`tel:${SITE.phoneRaw}`} className="inline-flex items-center gap-1.5 hover:opacity-90">
              <Phone className="h-3.5 w-3.5" /> {SITE.phone}
            </a>
            <a href={`mailto:${SITE.emails[1]}`} className="hidden md:inline hover:opacity-90">{SITE.emails[1]}</a>
          </div>
        </div>
      </div>
      <div className="container mx-auto container-px flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src={logo} alt="SS TECH SERVICES & ACADEMY logo" className="h-12 w-12 object-contain" width={48} height={48} />
          <div className="leading-tight">
            <div className="font-display text-base sm:text-lg font-bold tracking-tight text-primary">SS TECH SERVICES</div>
            <div className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-accent">& ACADEMY</div>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive ? "text-accent" : "text-foreground/80 hover:text-primary"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden xl:flex items-center gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/lms">Login</Link></Button>
          <Button asChild size="sm" className="bg-gradient-accent shadow-accent border-0"><Link to="/contact">Enroll Now</Link></Button>
        </div>

        <button
          aria-label="Toggle menu"
          className="xl:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="xl:hidden border-t border-border bg-background">
          <nav className="container mx-auto container-px py-4 grid gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-md text-sm font-medium ${
                    isActive || loc.pathname === n.to
                      ? "bg-secondary text-primary"
                      : "text-foreground/80 hover:bg-secondary"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <div className="flex gap-2 pt-3">
              <Button asChild variant="outline" className="flex-1"><Link to="/lms" onClick={() => setOpen(false)}>Login</Link></Button>
              <Button asChild className="flex-1 bg-gradient-accent border-0"><Link to="/contact" onClick={() => setOpen(false)}>Enroll</Link></Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}