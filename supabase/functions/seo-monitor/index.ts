import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";
const SITE = "https://sstechservices-org.lovable.app";
const ROUTES = [
  "/", "/about", "/services", "/academy", "/internship",
  "/placement", "/projects", "/careers", "/contact", "/quick-support",
];
const SITEMAP_URL = `${SITE}/sitemap.xml`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type SiteEntry = { siteUrl: string; permissionLevel?: string };

function coversTarget(siteUrl: string, target: URL) {
  if (siteUrl.startsWith("sc-domain:")) {
    const domain = siteUrl.slice("sc-domain:".length).toLowerCase();
    const host = target.hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  }
  try {
    return target.href.startsWith(new URL(siteUrl).href);
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const connectionApiKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
    if (!lovableApiKey || !connectionApiKey) {
      return json({ status: "not_configured", error: "Search Console credentials are missing" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admins only" }, 403);

    const headers = {
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": connectionApiKey,
    };

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const selected: string | undefined = body?.site_url;

    const sitesRes = await fetch(`${GATEWAY}/webmasters/v3/sites`, { headers });
    if (!sitesRes.ok) {
      const text = await sitesRes.text();
      console.error(`Could not list properties [${sitesRes.status}]: ${text}`);
      return json({ status: "gateway_error", http_status: sitesRes.status, details: text }, sitesRes.status);
    }
    const { siteEntry = [] } = (await sitesRes.json()) as { siteEntry?: SiteEntry[] };
    const target = new URL(SITE);
    const matches = siteEntry.filter(
      (e) => e.permissionLevel !== "siteUnverifiedUser" && coversTarget(e.siteUrl, target),
    );

    if (matches.length === 0) {
      return json({
        status: "no_verified_property",
        message:
          "No verified Search Console property covers this site yet, so Google indexing data is unavailable.",
        properties: siteEntry,
      });
    }
    let siteUrl: string;
    if (selected) {
      const hit = matches.find((m) => m.siteUrl === selected);
      if (!hit) return json({ status: "invalid_selection", candidates: matches.map((m) => m.siteUrl) }, 400);
      siteUrl = hit.siteUrl;
    } else if (matches.length === 1) {
      siteUrl = matches[0].siteUrl;
    } else {
      return json({ status: "selection_required", candidates: matches.map((m) => m.siteUrl) });
    }

    const encoded = encodeURIComponent(siteUrl);

    let sitemap: unknown = null;
    const smRes = await fetch(
      `${GATEWAY}/webmasters/v3/sites/${encoded}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`,
      { headers },
    );
    if (smRes.ok) {
      const sm = await smRes.json();
      sitemap = {
        path: sm.path,
        lastSubmitted: sm.lastSubmitted ?? null,
        lastDownloaded: sm.lastDownloaded ?? null,
        isPending: sm.isPending ?? null,
        errorCount: Number(sm.errors ?? 0),
        warningCount: Number(sm.warnings ?? 0),
        submittedUrls: sm.contents?.[0]?.submitted ?? null,
        indexedUrls: sm.contents?.[0]?.indexed ?? null,
      };
    } else {
      sitemap = { error: `Sitemap status unavailable [${smRes.status}]`, details: await smRes.text() };
    }

    const routes: unknown[] = [];
    for (const route of ROUTES) {
      const url = `${SITE}${route}`;
      const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionUrl: url, siteUrl }),
      });
      if (!res.ok) {
        const details = await res.text();
        console.error(`Inspection failed for ${url} [${res.status}]: ${details}`);
        routes.push({ route, url, status: "error", http_status: res.status, details });
        if (res.status === 403 || res.status === 429) break;
        continue;
      }
      const data = await res.json();
      const idx = data?.inspectionResult?.indexStatusResult ?? {};
      routes.push({
        route,
        url,
        status: "ok",
        verdict: idx.verdict ?? "UNKNOWN",
        coverageState: idx.coverageState ?? null,
        indexingState: idx.indexingState ?? null,
        robotsTxtState: idx.robotsTxtState ?? null,
        lastCrawlTime: idx.lastCrawlTime ?? null,
        googleCanonical: idx.googleCanonical ?? null,
        userCanonical: idx.userCanonical ?? null,
        sitemaps: idx.sitemap ?? [],
        richResults: data?.inspectionResult?.richResultsResult?.verdict ?? null,
        mobileUsability: data?.inspectionResult?.mobileUsabilityResult?.verdict ?? null,
      });
    }

    const refreshedAt = new Date().toISOString();
    const { data: saved, error: saveError } = await admin
      .from("seo_index_snapshots")
      .insert({ site_url: siteUrl, refreshed_at: refreshedAt, sitemap, routes, created_by: user.id })
      .select()
      .single();
    if (saveError) console.error("Could not store snapshot:", saveError.message);

    return json({ status: "ok", site_url: siteUrl, refreshed_at: refreshedAt, sitemap, routes, snapshot_id: saved?.id ?? null });
  } catch (e) {
    console.error("seo-monitor failed:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
