import catCyber from "@/assets/cat-cyber.jpg";
import catCloud from "@/assets/cat-cloud.jpg";
import catDevops from "@/assets/cat-devops.jpg";
import catNetworking from "@/assets/cat-networking.jpg";
import catDevelopment from "@/assets/cat-development.jpg";
import catData from "@/assets/cat-data.jpg";
import svcNetwork from "@/assets/svc-network.jpg";
import svcCabling from "@/assets/svc-cabling.jpg";
import svcServer from "@/assets/svc-server.jpg";
import svcLinux from "@/assets/svc-linux.jpg";
import svcOpenshift from "@/assets/svc-openshift.jpg";
import svcCloud from "@/assets/svc-cloud.jpg";
import svcCctv from "@/assets/svc-cctv.jpg";
import svcSoc from "@/assets/svc-soc.jpg";
import svcManpower from "@/assets/svc-manpower.jpg";

type Media = { src: string; alt: string };

/** Course category → animated visual. */
const COURSE_MEDIA: Record<string, Media> = {
  "cyber security": { src: catCyber, alt: "Neon cyber security shield with code streams" },
  cloud: { src: catCloud, alt: "Glowing neon cloud connected to data centres" },
  devops: { src: catDevops, alt: "Neon DevOps CI/CD pipeline with containers" },
  networking: { src: catNetworking, alt: "Illuminated network switches and patch cables" },
  development: { src: catDevelopment, alt: "Neon developer workspace with code editors" },
  "data & ai": { src: catData, alt: "Glowing neural network with analytics dashboards" },
};

const KEYWORD_MEDIA: [RegExp, Media][] = [
  [/soc|security|cyber|hack|wazuh|splunk|range/i, { src: svcSoc, alt: "Security operations centre with live dashboards" }],
  [/cabl|fiber|cat6/i, { src: svcCabling, alt: "Structured cabling bundles in a data centre rack" }],
  [/openshift|kubernetes|container|docker|devops/i, { src: svcOpenshift, alt: "OpenShift and Kubernetes cluster visualisation" }],
  [/aws|azure|gcp|cloud/i, { src: svcCloud, alt: "Neon cloud connected to a multi-cloud network" }],
  [/cctv|camera|surveill/i, { src: svcCctv, alt: "IP CCTV camera monitoring at night" }],
  [/linux|rhce|rhcsa|ansible/i, { src: svcLinux, alt: "Linux terminals and automation on glowing screens" }],
  [/network|ccna|router|switch/i, { src: svcNetwork, alt: "Glowing enterprise network topology" }],
  [/server|data cent|rack/i, { src: svcServer, alt: "Engineer installing a rack server" }],
  [/developer|full stack|mern|react|frontend|software/i, { src: catDevelopment, alt: "Neon developer workspace with code editors" }],
  [/analyt|data|power bi|ai|machine/i, { src: catData, alt: "Glowing neural network with analytics dashboards" }],
  [/business|sales|hr|manpower|staff|trainer/i, { src: svcManpower, alt: "Team of IT professionals collaborating" }],
];

export function courseMedia(category: string, title = ""): Media {
  return COURSE_MEDIA[category?.toLowerCase()] ?? mediaFor(`${category} ${title}`);
}

export function mediaFor(text: string): Media {
  for (const [re, media] of KEYWORD_MEDIA) if (re.test(text)) return media;
  return { src: svcServer, alt: "Enterprise IT infrastructure in a data centre" };
}

/** Ken-Burns + scan-line media strip that makes a static image feel live. */
export default function LiveMedia({
  media,
  label = "Live",
  className = "h-40",
}: {
  media: Media;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-primary ${className}`}>
      <img
        src={media.src}
        alt={media.alt}
        loading="lazy"
        width={768}
        height={512}
        className="h-full w-full object-cover animate-ken-burns group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />
      <div className="absolute inset-0 animate-scan pointer-events-none" />
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-accent live-dot" /> {label}
      </div>
    </div>
  );
}