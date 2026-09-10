import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { useLmsAuth } from "@/hooks/useLmsAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Seo from "@/components/Seo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { History, ArrowLeft, RefreshCw, Download, CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

type Log = {
  id: string;
  entity_type: string;
  action: string;
  summary: string | null;
  actor_email: string | null;
  created_at: string;
};

const ACTION_STYLE: Record<string, string> = {
  insert: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  update: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  delete: "bg-destructive/15 text-destructive",
};

const ACTION_LABEL: Record<string, string> = { insert: "Created", update: "Updated", delete: "Deleted" };

const PAGE_SIZE = 25;

export default function LmsActivity() {
  const nav = useNavigate();
  const { user, loading, canManage } = useLmsAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [range, setRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);


  useEffect(() => {
    if (!loading && !user) nav("/lms/auth", { replace: true });
  }, [loading, user, nav]);

  async function load() {
    setBusy(true);
    const { data } = await supabase
      .from("activity_log")
      .select("id,entity_type,action,summary,actor_email,created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    setLogs((data ?? []) as Log[]);
    setBusy(false);
  }

  useEffect(() => {
    if (user && canManage) load();
  }, [user, canManage]);

  const types = Array.from(new Set(logs.map((l) => l.entity_type))).sort();

  const list = useMemo(() => {
    const from = range?.from ? new Date(new Date(range.from).setHours(0, 0, 0, 0)).getTime() : null;
    const to = range?.to
      ? new Date(new Date(range.to).setHours(23, 59, 59, 999)).getTime()
      : range?.from
        ? new Date(new Date(range.from).setHours(23, 59, 59, 999)).getTime()
        : null;
    return logs.filter((l) => {
      const t = new Date(l.created_at).getTime();
      if (from !== null && t < from) return false;
      if (to !== null && t > to) return false;
      if (type !== "all" && l.entity_type !== type) return false;
      return `${l.entity_type} ${l.action} ${l.summary ?? ""} ${l.actor_email ?? ""}`
        .toLowerCase()
        .includes(q.toLowerCase());
    });
  }, [logs, q, type, range]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const pageRows = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [q, type, range]);

  const rangeLabel = range?.from
    ? `${format(range.from, "dd MMM yyyy")}${range.to ? ` – ${format(range.to, "dd MMM yyyy")}` : ""}`
    : "All dates";

  /** Exports only the currently filtered results (search + type + date range). */
  function exportCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["Timestamp", "Type", "Action", "Summary", "Actor"],
      ...list.map((l) => [
        new Date(l.created_at).toISOString(),
        l.entity_type,
        ACTION_LABEL[l.action] ?? l.action,
        l.summary ?? "",
        l.actor_email ?? "system",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => esc(String(c))).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ss-tech-services-activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }


  return (
    <>
      <Seo title="Activity Log — SS TECH SERVICES LMS" description="Audit trail of course, quiz and certificate changes in the SS TECH SERVICES LMS." path="/lms/activity" noindex />
      <section className="section-py container mx-auto container-px">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-6 w-6 text-accent" />
              <h1 className="font-display text-3xl font-bold text-primary">Activity log</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Every course, lesson, assignment, quiz and certificate change with a timestamp and the admin or trainer who made it.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/lms/manage"><ArrowLeft className="mr-2 h-4 w-4" /> Manage</Link></Button>
            <Button variant="ghost" onClick={load} disabled={busy}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
          </div>
        </div>

        {!canManage ? (
          <Card className="p-6 text-sm text-muted-foreground">
            This page is available to admins and trainers only.
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <Input
                className="max-w-md"
                aria-label="Search activity log"
                placeholder="Search by course, action or user…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[200px]" aria-label="Filter by record type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {types.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start font-normal", !range?.from && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" /> {rangeLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    numberOfMonths={2}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {range?.from && (
                <Button variant="ghost" size="sm" onClick={() => setRange(undefined)}>
                  <X className="mr-1 h-4 w-4" /> Clear dates
                </Button>
              )}
              <Button variant="outline" onClick={exportCsv} disabled={list.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export filtered CSV
              </Button>
              <span className="text-xs text-muted-foreground">{list.length} of {logs.length} entries</span>
            </div>
            {list.length === 0 ? (
              <Card className="p-6 text-sm text-muted-foreground">No activity matches these filters.</Card>
            ) : (
              <>
                <Card className="divide-y divide-border">
                  {pageRows.map((l) => (
                    <div key={l.id} className="p-4 flex flex-wrap items-center gap-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${ACTION_STYLE[l.action] ?? "bg-secondary"}`}>
                        {ACTION_LABEL[l.action] ?? l.action}
                      </span>
                      <Badge variant="outline" className="capitalize">{l.entity_type.replace("_", " ")}</Badge>
                      <span className="text-sm text-primary font-medium flex-1 min-w-[200px]">{l.summary ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">{l.actor_email ?? "system"}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {new Date(l.created_at).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </Card>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, list.length)} of {list.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </Button>
                    <span className="text-xs text-muted-foreground tabular-nums">Page {current} / {pages}</span>
                    <Button variant="outline" size="sm" disabled={current >= pages} onClick={() => setPage(current + 1)}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

          </>
        )}
      </section>
    </>
  );
}
