"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, CheckCircle2, Circle, Droplets, Wind, Thermometer, Waves, CloudRain,
  Activity, RefreshCw, Sparkles, MapPinned, BookOpenCheck, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCard, type AlertLike } from "@/components/alert-card";
import { RiskStatusPill } from "@/components/badges";
import { fetchJson, timeAgo } from "@/lib/fetcher";
import { alertAffectsUser, formatDistance, haversineKm } from "@/lib/geo";
import { SEVERITY_META, type Severity } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface MeResponse {
  name: string;
  profile: { city?: string; region?: string; lat?: number | null; lng?: number | null };
  emergencyContacts: unknown[];
  _count: { notifications: number };
}
interface ChecklistResponse { items: { itemKey: string; label: string; category: string; checked: boolean }[]; score: number; checked: number; total: number }
interface ObsResponse { observations: { provider: string; metric: string; value: number; unit: string; dataBasis: string; note?: string }[] }

function riskFor(alerts: AlertLike[]): Severity {
  let max: Severity = "LOW";
  for (const a of alerts) {
    const r = SEVERITY_META[(a.severity as Severity)]?.rank ?? 0;
    if (r > (SEVERITY_META[max]?.rank ?? 0)) max = a.severity as Severity;
  }
  return max;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [checklistLocal, setChecklistLocal] = useState<Record<string, boolean>>({});

  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchJson<MeResponse>("/api/me") });
  const active = useQuery({
    queryKey: ["active-alerts"],
    queryFn: () => fetchJson<{ alerts: AlertLike[]; fetchedAt: string }>("/api/alerts/active"),
    refetchInterval: 25_000,
  });
  const checklist = useQuery({ queryKey: ["preparedness"], queryFn: () => fetchJson<ChecklistResponse>("/api/preparedness") });

  const region = me.data?.profile?.region ?? me.data?.profile?.city ?? "";
  const obs = useQuery({
    queryKey: ["observations", region],
    queryFn: () => fetchJson<ObsResponse>(`/api/providers/observations?location=${encodeURIComponent(region)}`),
    enabled: !!region,
    refetchInterval: 60_000,
  });

  const user = {
    region,
    lat: me.data?.profile?.lat ?? null,
    lng: me.data?.profile?.lng ?? null,
  };

  const { affecting, nearby } = (() => {
    const all = active.data?.alerts ?? [];
    const aff: (AlertLike & { distanceKm?: number })[] = [];
    const near: (AlertLike & { distanceKm?: number })[] = [];
    for (const a of all) {
      const d = user.lat != null && user.lng != null ? haversineKm(user.lat, user.lng, a.latitude, a.longitude) : undefined;
      if (alertAffectsUser(a, user)) aff.push({ ...a, distanceKm: d });
      else near.push({ ...a, distanceKm: d });
    }
    aff.sort((x, y) => (SEVERITY_META[y.severity as Severity]?.rank ?? 0) - (SEVERITY_META[x.severity as Severity]?.rank ?? 0));
    return { affecting: aff, nearby: near };
  })();

  const risk = riskFor(affecting);
  const firstName = (me.data?.name ?? session?.user?.name ?? "there").split(" ")[0];

  const toggleItem = async (itemKey: string, current: boolean) => {
    setChecklistLocal((p) => ({ ...p, [itemKey]: !current }));
    try {
      await fetch("/api/preparedness/toggle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemKey, checked: !current }),
      });
      await checklist.refetch();
    } catch {
      setChecklistLocal((p) => ({ ...p, [itemKey]: current }));
    }
  };

  const metricIcon = (m: string) => {
    if (m.includes("rain")) return <CloudRain className="h-4 w-4 text-sky-400" />;
    if (m.includes("river")) return <Waves className="h-4 w-4 text-cyan-400" />;
    if (m.includes("wind")) return <Wind className="h-4 w-4 text-teal-400" />;
    if (m.includes("temp")) return <Thermometer className="h-4 w-4 text-orange-400" />;
    return <Activity className="h-4 w-4 text-violet-400" />;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Hello, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">
            Watching over <span className="font-semibold text-foreground">{region || "your area"}</span>
            {me.data?.profile?.city && me.data.profile.city !== region ? ` (${me.data.profile.city})` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className={cn("h-3.5 w-3.5", active.isFetching && "animate-spin")} />
          Last updated: {active.data ? timeAgo(active.data.fetchedAt) : "…"}
          <span className="text-muted-foreground/50">·</span>
          <span className="inline-flex items-center gap-1 rounded border border-dashed border-amber-500/50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">
            demo data
          </span>
        </div>
      </div>

      {/* safety status */}
      <Card className={cn("overflow-hidden border-2", risk === "CRITICAL" ? "border-red-500/60" : risk === "HIGH" ? "border-orange-500/50" : risk === "MODERATE" ? "border-yellow-500/40" : "border-emerald-500/30")}>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          {active.isLoading || me.isLoading ? (
            <div className="space-y-2"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-72" /></div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <RiskStatusPill level={risk} size="lg" />
                <div>
                  <p className="font-bold">
                    {risk === "LOW" && "Your selected area currently has no active critical alerts."}
                    {risk === "MODERATE" && "Stay aware — watch-level activity around your area."}
                    {risk === "HIGH" && "Take recommended precautions now — significant threat nearby."}
                    {risk === "CRITICAL" && "Immediate action may be required. Open Emergency Mode."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {affecting.length} active alert{affecting.length === 1 ? "" : "s"} affecting your area · {active.data?.alerts.length ?? 0} total tracked
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="font-bold">
                  <Link href="/dashboard/map">Live map</Link>
                </Button>
                <Button asChild size="sm" className={cn("font-bold", risk === "CRITICAL" && "bg-red-600 hover:bg-red-500")}>
                  <Link href="/emergency">Emergency Mode</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* current alerts */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Current Alerts</h2>
            <Link href="/dashboard/alerts" className="inline-flex items-center text-sm font-semibold text-cyan-400 hover:underline">
              History <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>

          {active.isLoading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
          ) : affecting.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <p className="mt-3 font-bold">No active alerts for your area</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {region ? `${region} has no active warnings right now. Alerts from other regions below.` : "Set your region in Settings to receive targeted alerts."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {affecting.map((a) => (
                <div key={a.id}>
                  {a.distanceKm != null && (
                    <p className="mb-1 ml-1 text-[11px] font-semibold text-muted-foreground">
                      ~{formatDistance(a.distanceKm)} from your saved location
                    </p>
                  )}
                  <AlertCard alert={a} />
                </div>
              ))}
            </div>
          )}

          {nearby.length > 0 && (
            <>
              <h3 className="pt-2 text-sm font-bold text-muted-foreground">Elsewhere in India (demo)</h3>
              <div className="space-y-3">
                {nearby.slice(0, 3).map((a) => (
                  <AlertCard key={a.id} alert={a} compact />
                ))}
              </div>
            </>
          )}
        </div>

        {/* right column */}
        <div className="space-y-6">
          {/* my area indicators */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><MapPinned className="h-4.5 w-4.5 text-cyan-400" /> My Area</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {obs.isLoading ? (
                <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : obs.data?.observations.length ? (
                obs.data.observations.map((o) => (
                  <div key={o.metric} className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm">
                      {metricIcon(o.metric)}
                      <span className="capitalize">{o.metric.replace(/_/g, " ")}</span>
                    </span>
                    <span className="text-sm font-bold">{o.value}<span className="ml-0.5 text-xs font-normal text-muted-foreground">{o.unit}</span></span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Set your region to see live indicators.</p>
              )}
              <p className="text-[10px] leading-relaxed text-muted-foreground/70">
                Simulated provider readings (Weather / Earthquake / Flood / Satellite mock feeds). Connect real APIs via the pluggable provider layer.
              </p>
              <div className="rounded-lg border border-border/70 bg-muted/40 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Safety recommendations</p>
                <ul className="mt-2 space-y-1.5 text-xs">
                  <li>• Keep drinking water and medicines stocked</li>
                  <li>• Charge power bank tonight</li>
                  <li>• Review your evacuation plan with family</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* emergency readiness */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2"><BookOpenCheck className="h-4.5 w-4.5 text-cyan-400" /> Emergency Readiness</span>
                <span className="text-sm font-black text-cyan-300">{checklist.data?.score ?? 0}/100</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={checklist.data?.score ?? 0} className="h-2" />
              {checklist.isLoading ? (
                <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
              ) : (
                <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                  {checklist.data?.items.map((item) => {
                    const checked = checklistLocal[item.itemKey] ?? item.checked;
                    return (
                      <button
                        key={item.itemKey}
                        onClick={() => toggleItem(item.itemKey, checked)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/60"
                        aria-pressed={checked}
                      >
                        {checked ? <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" /> : <Circle className="h-4.5 w-4.5 shrink-0 text-muted-foreground/50" />}
                        <span className={cn(checked && "text-muted-foreground line-through")}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <Button asChild variant="outline" size="sm" className="w-full font-semibold">
                <Link href="/dashboard/preparedness"><Sparkles className="mr-1.5 h-4 w-4" /> Improve my score</Link>
              </Button>
            </CardContent>
          </Card>

          {/* quick links */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/assistant" className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-cyan-500/40">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <p className="mt-2 text-sm font-bold">Ask Guardian AI</p>
              <p className="text-xs text-muted-foreground">Safety questions, answered</p>
            </Link>
            <Link href="/dashboard/reports" className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-cyan-500/40">
              <ClipboardList className="h-5 w-5 text-cyan-400" />
              <p className="mt-2 text-sm font-bold">Report a hazard</p>
              <p className="text-xs text-muted-foreground">Help your community</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
