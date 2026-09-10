import { Helmet } from "react-helmet-async";

interface Crumb {
  name: string;
  path: string;
}

interface SeoProps {
  title: string;
  description: string;
  path: string;
  breadcrumbs?: Crumb[];
  noindex?: boolean;
}

const BASE = "https://sstechservices-org.lovable.app";

export default function Seo({ title, description, path, breadcrumbs, noindex }: SeoProps) {
  const url = `${BASE}${path}`;
  const crumbs: Crumb[] =
    breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbs
      : path === "/"
        ? [{ name: "Home", path: "/" }]
        : [
            { name: "Home", path: "/" },
            { name: title.split("—")[0].split("|")[0].trim(), path },
          ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${BASE}${c.path}`,
    })),
  };
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SS TECH SERVICES",
    url: BASE,
    logo: `${BASE}/app-icon-512.png`,
    telephone: "+91 8808227885",
    email: "info@sstechservices.org",
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "Knovatik Co-Working Space, Levana Cyber Heights, Vijaipur Colony, Vibhuti Khand, Gomti Nagar",
      addressLocality: "Lucknow",
      addressRegion: "Uttar Pradesh",
      postalCode: "226010",
      addressCountry: "IN",
    },
  };
  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url,
    isPartOf: { "@type": "Organization", name: "SS TECH SERVICES", url: BASE },
    breadcrumb: { "@type": "BreadcrumbList", itemListElement: breadcrumbLd.itemListElement },
  };
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="SS TECH SERVICES" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <script type="application/ld+json">{JSON.stringify(webPageLd)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      <script type="application/ld+json">{JSON.stringify(organizationLd)}</script>
    </Helmet>
  );
}