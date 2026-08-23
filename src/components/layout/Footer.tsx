import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Facebook, Linkedin, Instagram, Youtube } from "lucide-react";
import { SITE, NAV, IT_SERVICES } from "@/data/site";
import logo from "@/assets/logo.png";

export default function Footer() {
  return (
    <footer className="bg-gradient-dark text-primary-foreground">
      <div className="container mx-auto container-px py-16 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="SS TECH SERVICES & ACADEMY" className="h-12 w-12 object-contain bg-white/10 rounded-lg p-1" width={48} height={48} loading="lazy" />
            <div className="font-display font-bold leading-tight">
              <div className="text-sm">SS TECH SERVICES</div>
              <div className="text-[10px] tracking-[0.2em] text-accent">& ACADEMY</div>
            </div>
          </div>
          <p className="text-sm text-primary-foreground/70 leading-relaxed">
            Enterprise IT services, certified training academy, and a placement cell that bridges talent and opportunity.
          </p>
          <div className="flex gap-3 mt-5">
            {[Facebook, Linkedin, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href="#" aria-label="social" className="h-9 w-9 rounded-full bg-white/10 hover:bg-accent grid place-items-center transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-4">Quick Links</h4>
          <ul className="grid grid-cols-2 gap-2 text-sm text-primary-foreground/75">
            {NAV.map(n => (
              <li key={n.to}><Link to={n.to} className="hover:text-accent">{n.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-4">IT Services</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/75">
            {IT_SERVICES.slice(0,6).map(s => <li key={s.title}>{s.title}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-4">Reach Us</h4>
          <ul className="space-y-3 text-sm text-primary-foreground/80">
            <li className="flex gap-2"><MapPin className="h-4 w-4 mt-0.5 text-accent shrink-0" /><span>{SITE.address}</span></li>
            <li className="flex gap-2"><Phone className="h-4 w-4 mt-0.5 text-accent shrink-0" /><a href={`tel:${SITE.phoneRaw}`}>{SITE.phone}</a></li>
            {SITE.emails.map(e => (
              <li key={e} className="flex gap-2"><Mail className="h-4 w-4 mt-0.5 text-accent shrink-0" /><a href={`mailto:${e}`}>{e}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto container-px py-5 flex flex-col md:flex-row gap-2 items-center justify-between text-xs text-primary-foreground/60">
          <span>© {new Date().getFullYear()} SS TECH SERVICES & ACADEMY. All rights reserved.</span>
          <span>{SITE.tagline}</span>
        </div>
      </div>
    </footer>
  );
}