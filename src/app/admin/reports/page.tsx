"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ClipboardList, Check, X, CheckCheck, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson, postJson, timeAgo } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Report {
  id: string; reporterName: string; reportType: string; description: string; locationName: string;
  severity: string; status: string; createdAt: string; reviewNote?: string | null;
}

const TYPE_META: Record<string, string> = {
  FLOODING: "🌊 Flooding", ROAD_BLOCKAGE: "🚧 Road blockage", FIRE: "🔥 Fire", FALLEN_TREE: "🌳 Fallen tree",
  LANDSLIDE: "⛰ Landslide", INFRASTRUCTURE: "🏗 Infrastructure", OTHER: "⚠️ Other",
};

export default function AdminReportsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", statusFilter],
    queryFn: () => fetchJson<{ reports: Report[] }>(`/api/reports?status=${statusFilter}`),
    refetchInterval: 30_000,
  });

  const review = async (r: Report, status: "VERIFIED" | "REJECTED" | "RESOLVED") => {
    setBusyId(r.id);
    try {
      await postJson(`/api/reports/${r.id}`, { status });
      toast({
        title: `Report ${status.toLowerCase()} ✅`,
        description: status === "VERIFIED" ? "It is now visible as a confirmed community report." : undefined,
      });
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e) {
      toast({ title: "Action failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const badge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40",
      VERIFIED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
      REJECTED: "bg-red-500/15 text-red-400 border-red-500/40",
      RESOLVED: "bg-sky-500/15 text-sky-400 border-sky-500/40",
    };
    return <Badge variant="outline" className={cn("font-bold", map[s])}>{s}</Badge>;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-amber-400/25 bg-amber-400/10"><ClipboardList className="h-5 w-5 text-amber-400" /></span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Community Reports</h1>
            <p className="text-sm text-muted-foreground">Verify citizen reports before they become publicly visible.</p>
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["ALL", ...["PENDING", "VERIFIED", "REJECTED", "RESOLVED"]].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : !data?.reports.length ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">No reports with this status.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {data.reports.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{TYPE_META[r.reportType] ?? r.reportType}</span>
                    {badge(r.status)}
                    <Badge variant="outline" className="font-semibold">{r.severity}</Badge>
                    <span className="text-[11px] text-muted-foreground">{r.reporterName} · {timeAgo(r.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{r.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">📍 {r.locationName}</p>
                  {r.reviewNote && <p className="mt-1.5 rounded bg-muted/60 px-2.5 py-1.5 text-xs italic">Note: {r.reviewNote}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {r.status === "PENDING" && (
                    <>
                      <Button size="sm" className="bg-emerald-600 font-bold hover:bg-emerald-500" disabled={busyId === r.id} onClick={() => review(r, "VERIFIED")}>
                        {busyId === r.id ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />} Verify
                      </Button>
                      <Button size="sm" variant="outline" className="font-bold text-red-400" disabled={busyId === r.id} onClick={() => review(r, "REJECTED")}>
                        <X className="mr-1 h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {r.status === "VERIFIED" && (
                    <Button size="sm" variant="outline" className="font-bold" disabled={busyId === r.id} onClick={() => review(r, "RESOLVED")}>
                      <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark resolved
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground/70">
        Verified reports may surface on related alert detail pages as “verified community reports”. Unverified reports never appear as confirmed disasters.
      </p>
    </div>
  );
}
