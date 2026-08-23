import PageHero from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import InquiryForm from "@/components/InquiryForm";
import { SITE } from "@/data/site";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";

export default function Contact() {
  return (
    <>
      <PageHero eyebrow="Contact" title={<>Let's <span className="text-accent">talk.</span></>} sub="Reach out for course inquiries, enterprise services, partnerships or careers." />
      <section className="section-py container mx-auto container-px grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-6 border-border">
            <Phone className="h-6 w-6 text-accent mb-3" />
            <div className="font-semibold text-primary">Phone</div>
            <a href={`tel:${SITE.phoneRaw}`} className="text-muted-foreground hover:text-accent">{SITE.phone}</a>
          </Card>
          <Card className="p-6 border-border">
            <Mail className="h-6 w-6 text-accent mb-3" />
            <div className="font-semibold text-primary mb-1">Email</div>
            {SITE.emails.map(e => <div key={e}><a href={`mailto:${e}`} className="text-muted-foreground hover:text-accent text-sm">{e}</a></div>)}
          </Card>
          <Card className="p-6 border-border">
            <MapPin className="h-6 w-6 text-accent mb-3" />
            <div className="font-semibold text-primary mb-1">Address</div>
            <p className="text-muted-foreground text-sm leading-relaxed">{SITE.address}</p>
          </Card>
          <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-5 rounded-xl bg-[hsl(142_70%_40%)] hover:bg-[hsl(142_70%_35%)] text-white transition">
            <MessageCircle className="h-6 w-6" />
            <div><div className="font-semibold">Chat on WhatsApp</div><div className="text-xs opacity-90">Instant response, 9am – 9pm IST</div></div>
          </a>
        </div>
        <Card className="lg:col-span-3 p-8 shadow-elegant">
          <h2 className="font-display text-2xl font-bold text-primary mb-1">Send us a message</h2>
          <p className="text-sm text-muted-foreground mb-6">We typically respond within a few hours.</p>
          <InquiryForm />
        </Card>
      </section>
      <section className="pb-16 container mx-auto container-px">
        <div className="rounded-2xl overflow-hidden border border-border shadow-elegant">
          <iframe
            title="SS TECH SERVICES & ACADEMY Location"
            src="https://www.google.com/maps?q=Levana+Cyber+Heights,+Vibhuti+Khand,+Gomti+Nagar,+Lucknow&output=embed"
            width="100%"
            height="420"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  );
}