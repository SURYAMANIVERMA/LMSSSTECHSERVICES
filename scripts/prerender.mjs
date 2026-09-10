#!/usr/bin/env node
// Static prerender: for each configured route, copy dist/index.html into
// dist/<route>/index.html with route-specific <title>, <meta description>,
// canonical/og URLs injected. Google crawls real URLs and gets correct
// metadata immediately, before React hydration.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const BASE_URL = "https://sstechservices-org.lovable.app";

const ROUTES = [
  { path: "/about",         title: "About SS TECH SERVICES | Lucknow IT & Training", description: "Learn about SS TECH SERVICES — Lucknow-based enterprise IT services and industry-aligned tech training in Cyber Security, Cloud and Full Stack." },
  { path: "/academy",       title: "Course Catalogue — SS TECH SERVICES LMS", description: "30+ industry-grade tech programs — Cyber Security, Cloud, DevOps, Full Stack, Data and AI — with live mentors, labs, certifications and placement support." },
  { path: "/lms/courses",   title: "Course Catalogue — SS TECH SERVICES LMS", description: "Browse 30+ tech courses in Cyber Security, Cloud, DevOps, Full Stack, Data and AI from the SS TECH SERVICES Training Academy." },
  { path: "/projects",      title: "Student Capstone Projects | SS TECH SERVICES Academy",     description: "Capstone projects our students build — SOC labs, pentest reports, CI/CD pipelines, MERN portals, ML models and Android apps." },
  { path: "/careers",       title: "Careers at SS TECH SERVICES",                     description: "Join SS TECH SERVICES — open roles for engineers, trainers and support staff in Lucknow and remote." },
  { path: "/contact",       title: "Contact SS TECH SERVICES — Lucknow",              description: "Reach SS TECH SERVICES in Vibhuti Khand, Gomti Nagar, Lucknow. Call +91 8808227885 or email surya@sstechservices.org." },
];

const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Knovatik Co-Working Space, Levana Cyber Heights, Vijaipur Colony, Vibhuti Khand, Gomti Nagar",
  addressLocality: "Lucknow",
  addressRegion: "Uttar Pradesh",
  postalCode: "226010",
  addressCountry: "IN",
};

const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SS TECH SERVICES",
  url: BASE_URL,
  logo: `${BASE_URL}/app-icon-512.png`,
  telephone: "+91 8808227885",
  email: "info@sstechservices.org",
  address: ADDRESS,
};

const LOCAL_BUSINESS = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "SS TECH SERVICES",
  image: `${BASE_URL}/app-icon-512.png`,
  telephone: "+91 8808227885",
  email: "info@sstechservices.org",
  priceRange: "₹₹",
  address: ADDRESS,
  url: `${BASE_URL}/`,
};

if (!existsSync(DIST)) {
  console.warn("[prerender] dist/ not found — skipping.");
  process.exit(0);
}

const template = readFileSync(resolve(DIST, "index.html"), "utf8");

function breadcrumbs(path, title) {
  const crumbs = path === "/"
    ? [{ name: "Home", path: "/" }]
    : [
        { name: "Home", path: "/" },
        { name: title.split("—")[0].split("|")[0].trim(), path },
      ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${BASE_URL}${c.path}`,
    })),
  };
}

function jsonLdScripts(path, title, description) {
  const url = `${BASE_URL}${path}`;
  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url,
    isPartOf: { "@type": "Organization", name: "SS TECH SERVICES", url: BASE_URL },
    breadcrumb: breadcrumbs(path, title),
  };
  return [
    `<script type="application/ld+json">${JSON.stringify(webPage)}</script>`,
    `<script type="application/ld+json">${JSON.stringify(breadcrumbs(path, title))}</script>`,
    `<script type="application/ld+json">${JSON.stringify(ORGANIZATION)}</script>`,
    ...(path === "/" ? [`<script type="application/ld+json">${JSON.stringify(LOCAL_BUSINESS)}</script>`] : []),
  ].join("\n    ");
}

function replaceMeta(html, { path, title, description }) {
  const url = `${BASE_URL}${path}`;
  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
  out = out.replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${description}">`);
  out = out.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${url}" />`);
  // og:title / og:description may be absent from the template (injected at
  // runtime by helmet). Replace when present, otherwise inject after og:type.
  if (/<meta\s+property="og:title"[^>]*>/i.test(out)) {
    out = out.replace(/<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}">`);
  } else {
    out = out.replace(/<meta\s+property="og:type"[^>]*>/i, `$&\n    <meta property="og:title" content="${title}">`);
  }
  if (/<meta\s+property="og:description"[^>]*>/i.test(out)) {
    out = out.replace(/<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${description}">`);
  } else {
    out = out.replace(/<meta\s+property="og:title"[^>]*>/i, `$&\n    <meta property="og:description" content="${description}">`);
  }
  out = out.replace(/<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${url}" />`);
  out = out.replace(/<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}">`);
  out = out.replace(/<meta\s+name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${description}">`);
  // Replace the static JSON-LD scripts with the per-route WebPage + BreadcrumbList + Organization trio.
  out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, jsonLdScripts(path, title, description));
  return out;
}

const HOME = {
  path: "/",
  title: "SS Tech Services — IT Training & Services",
  description: "Enterprise IT services and certified tech training in Lucknow — Cyber Security, Cloud, DevOps, Networking and Full Stack, with placement support.",
};

let count = 0;
// Homepage gets the WebPage trio too.
writeFileSync(resolve(DIST, "index.html"), replaceMeta(template, HOME), "utf8");
count++;

for (const route of ROUTES) {
  const dir = resolve(DIST, route.path.replace(/^\//, ""));
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), replaceMeta(template, route), "utf8");
  count++;
}
console.log(`[prerender] wrote ${count} route HTML files`);