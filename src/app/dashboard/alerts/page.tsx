"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { History, Search } from "lucide-react";
import { AlertCard, type AlertLike } from "@/components/alert-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/fetcher";
import { DISASTER_TYPES, DISASTER_META, SEVERITIES, SEVERITY_META } from "@/lib/constants";

interface AlertsResponse {
  alerts: (AlertLike & { region: string; recommendedActions: string[] })[];
  total: number;
  totalPages: number;
}

export default function AlertHistoryPage() {
  const [filters, setFilters] = useState({ status: "ALL", type: "ALL", severity: "ALL", region: "", from: "", to: "" });
  const [page, setPage] = useState(1);

  const query = new URLSearchParams({
    page: String(page),
    pageSize: "12",
    status: filters.status,
    type: filters.type,
    severity: filters.severity,
    ...(filters.region ? { region: filters.region } : {}),
    ...(filters.from ? { from: new Date(filters.from).toISOString() } : {}),
    ...(filters.to ? { to: new Date(filters.to + "T23:59:59").toISOString() } : {}),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["alerts-history", query.toString()],
    queryFn: () => fetchJson<AlertsResponse>(`/api/alerts?${query.toString()}`),
  });

  const set = (k: keyof typeof filters) => (v: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: v }));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10"><History className="h-5 w-5 text-cyan-400" /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Alert History</h1>
          <p className="text-sm text-muted-foreground">Every alert ever issued — {data?.total ?? "…"} records (demo dataset).</p>
        </div>
      </div>

      {/* filters */}
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Status</label>
          <Select value={filters.status} onValueChange={set("status")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["ALL", "ACTIVE", "RESOLVED", "CANCELLED", "EXPIRED"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Disaster</label>
          <Select value={filters.type} onValueChange={set("type")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              {DISASTER_TYPES.map((t) => <SelectItem key={t} value={t}>{DISASTER_META[t].label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Severity</label>
          <Select value={filters.severity} onValueChange={set("severity")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{SEVERITY_META[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Region</label>
          <Input placeholder="e.g. Lucknow" value={filters.region} onChange={(e) => set("region")(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">From</label>
          <Input type="date" value={filters.from} onChange={(e) => set("from")(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">To</label>
          <Input type="date" value={filters.to} onChange={(e) => set("to")(e.target.value)} />
        </div>
      </div>

      {/* list */}
      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : !data || data.alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Search className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 font-bold">No alerts match these filters</p>
          <p className="text-sm text-muted-foreground">Try widening the date range or clearing filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.alerts.map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
        </div>
      )}

      {/* pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
