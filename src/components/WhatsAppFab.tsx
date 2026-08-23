import { SITE } from "@/data/site";

export default function WhatsAppFab() {
  const msg = encodeURIComponent("Hi SS TECH SERVICES & ACADEMY, I'd like to know more about your courses.");
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
<a
  href="https://apps.sstechservices.org/"
  target="_blank"
  rel="noopener noreferrer"
  className="hidden sm:flex items-center gap-2 rounded-full bg-gradient-accent px-4 py-2 text-xs font-bold text-white shadow-accent hover:scale-105 transition-transform"
>
  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
  ⚡ Quick Support · Reply in 5 min
</a>
      <a
        href={`https://wa.me/${SITE.whatsapp}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="relative wa-pulse h-14 w-14 rounded-full bg-[hsl(142_70%_40%)] hover:bg-[hsl(142_70%_35%)] grid place-items-center shadow-lg transition-transform hover:scale-110"
      >
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-[10px] font-bold text-white grid place-items-center animate-bounce">1</span>
        <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white" aria-hidden="true">
          <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.45-1.611-.911-2.339-1.47-.546-.42-1.097-.946-1.515-1.492-.601-.795-1.231-1.768-1.482-2.73-.158-.605.402-1.05.882-1.353.184-.116.387-.083.522-.244.119-.141.291-.376.291-.572 0-.196-.057-.382-.158-.598-.16-.323-.59-1.36-.832-1.99-.211-.547-.327-.927-.83-.927-.122 0-.249.022-.36.022-.18 0-.473.121-.69.36-.398.444-.985 1.193-.985 2.444 0 1.302.97 2.541 1.114 2.745 1.51 2.146 3.066 4.137 5.624 5.155.582.235 1.166.444 1.812.444.84 0 1.74-.34 2.4-.802.428-.301.802-.711.802-1.225 0-.144-.072-.27-.144-.388-.158-.224-.522-.245-.821-.388-.299-.143-1.766-.91-2.04-1.018-.273-.108-.473-.144-.673.144-.2.289-.769.965-.945 1.166-.176.201-.353.224-.652.072z"/>
          <path d="M16 0a16 16 0 0 0-13.93 23.85L0 32l8.36-2.19A16 16 0 1 0 16 0zm0 29.06a13.04 13.04 0 0 1-6.65-1.82l-.48-.28-4.96 1.3 1.33-4.84-.31-.5A13.06 13.06 0 1 1 16 29.06z"/>
        </svg>
      </a>
    </div>
  );
}
