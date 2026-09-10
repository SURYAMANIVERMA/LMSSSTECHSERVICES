import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import Seo from "@/components/Seo";
import PageHero from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type RouteRow = {
  route: string;
  url: string;
  status: string;
  verdict?: string;
  coverageState?: string | null;
  indexingState?: string | null;
  robotsTxtState?: string | null;
  lastCrawlTime?: string | null;
  googleCanonical?: string | null;
  userCanonical?: string | null;
  richResults?: string | null;
  mobileUsability?: string | null;
  http_status?: number;
  details?: string;
};

type Snapshot = {
  status?: string;
  message?: string;
  site_url?: string;
  refreshed_at?: string;
  sitemap?: Record<string, unknown> | null;
  routes?: RouteRow[];
  candidates?: string[];
};

const verdictTone = (verdict?: string) => {
  switch (verdict) {
    case "PASS":
      return "bg-primary/15 text-primary border-primary/30";
    case "NEUTRAL":
      return "bg-muted text-muted-foreground border-border";
    case "FAIL":
      return "bg-destructive/15 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export default function SeoMonitor() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) {
        navigate("/admin/auth");
        return;
      }
      const { data: cached } = await supabase
        .from("seo_index_snapshots")
        .select("site_url, refreshed_at, sitemap, routes")
        .order("refreshed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (cached) {
        setSnapshot({
          status: "ok",
          site_url: cached.site_url,
          refreshed_at: cached.refreshed_at,
          sitemap: cached.sitemap as Record<string, unknown> | null,
          routes: (cached.routes as unknown as RouteRow[]) ?? [],
        });
      }
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  const runCheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-monitor", { body: {} });
      if (error) {
        const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
        console.error("seo-monitor failed:", details);
        let parsed: Snapshot | null = null;
        try {
          parsed = JSON.parse(details);
        } catch {
          parsed = null;
        }
        if (parsed) setSnapshot(parsed);
        toast.error(parsed?.message ?? parsed?.status ?? "Could not run the indexing check");
        return;
      }
      setSnapshot(data as Snapshot);
      const result = data as Snapshot;
      if (result.status === "ok") toast.success("Indexing status refreshed");
      else toast.warning(result.message ?? result.status ?? "Search Console data unavailable");
    } finally {
      setLoading(false);
    }
  };

  const sitemap = snapshot?.sitemap as
    | {
        error?: string;
        lastSubmitted?: string | null;
        lastDownloaded?: string | null;
        errorCount?: number;
        warningCount?: number;
        submittedUrls?: string | null;
        indexedUrls?: string | null;
      }
    | null
    | undefined;

  return (
    <>
      <Seo
        title="Indexing Monitor — SS TECH SERVICES"
        description="Admin monitor for Google coverage and indexing status of the main routes."
        path="/admin/seo-monitor"
        noindex
      />
      <PageHero
        eyebrow="Admin"
        title="Indexing Monitor"
        sub="Coverage and indexing status for every main route, read from Google Search Console."
      />
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {snapshot?.refreshed_at
              ? `Last checked ${new Date(snapshot.refreshed_at).toLocaleString()}${
                  snapshot.site_url ? ` · ${snapshot.site_url}` : ""
                }`
              : "No check has run yet."}
          </div>
          <Button onClick={runCheck} disabled={loading || checking}>
            {loading ? "Checking Google…" : "Run check now"}
          </Button>
        </div>

        {snapshot && snapshot.status !== "ok" && (
          <Card className="mt-8 border-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg">Search Console data unavailable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{snapshot.message ?? `Status: ${snapshot.status}`}</p>
              {snapshot.candidates?.length ? (
                <p>Matching properties: {snapshot.candidates.join(", ")}</p>
              ) : null}
            </CardContent>
          </Card>
        )}

        {sitemap && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Sitemap status</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              {sitemap.error ? (
                <p className="text-muted-foreground sm:col-span-2">{sitemap.error}</p>
              ) : (
                <>
                  <div>Last submitted: {sitemap.lastSubmitted ?? "—"}</div>
                  <div>Last downloaded by Google: {sitemap.lastDownloaded ?? "—"}</div>
                  <div>URLs submitted: {sitemap.submittedUrls ?? "—"}</div>
                  <div>URLs indexed: {sitemap.indexedUrls ?? "—"}</div>
                  <div>Errors reported: {sitemap.errorCount ?? 0}</div>
                  <div>Warnings reported: {sitemap.warningCount ?? 0}</div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {snapshot?.routes?.length ? (
          <div className="mt-8 grid gap-4">
            {snapshot.routes.map((row) => (
              <Card key={row.route}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                  <CardTitle className="text-base font-semibold">{row.route}</CardTitle>
                  <Badge variant="outline" className={verdictTone(row.verdict)}>
                    {row.status === "ok" ? (row.verdict ?? "UNKNOWN") : `ERROR ${row.http_status ?? ""}`}
                  </Badge>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  {row.status === "ok" ? (
                    <>
                      <div>Coverage: {row.coverageState ?? "—"}</div>
                      <div>Indexing allowed: {row.indexingState ?? "—"}</div>
                      <div>Robots.txt: {row.robotsTxtState ?? "—"}</div>
                      <div>
                        Last crawled:{" "}
                        {row.lastCrawlTime ? new Date(row.lastCrawlTime).toLocaleString() : "never"}
                      </div>
                      <div>Google canonical: {row.googleCanonical ?? "—"}</div>
                      <div>Rich results: {row.richResults ?? "—"}</div>
                    </>
                  ) : (
                    <p className="sm:col-span-2">{row.details ?? "Inspection failed."}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
