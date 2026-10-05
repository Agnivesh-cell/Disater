"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MapPin, Home, Filter } from "lucide-react";
import { DisasterMap, type MapAlert, type MapShelter } from "@/components/disaster-map";
import { fetchJson, timeAgo } from "@/lib/fetcher";
import { DISASTER_META, SEVERITY_META, type DisasterType, type Severity } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const FILTERS: { key: string; label: string; emoji: string }[] = [
  { key: "ALL", label: "All", emoji: "🛰" },
  { key: "EARTHQUAKE", label: "Earthquake", emoji: "🌎" },
  { key: "FLOOD", label: "Flood", emoji: "🌊" },
  { key: "CYCLONE", label: "Cyclone", emoji: "🌪" },
  { key: "WILDFIRE", label: "Fire", emoji: "🔥" },
  { key: "STORM", label: "Storm", emoji: "⛈" },
  { key: "LANDSLIDE", label: "Landslide", emoji: "⛰" },
  { key: "HEATWAVE", label: "Heatwave", emoji: "🌡" },
];

export default function MapPage() {
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<string | null>(null);
  const [center, setCenter] = useState<[number, number] | undefined>();
  const [zoom, setZoom] = useState(5);

  const alertsQ = useQuery({
    queryKey: ["map-alerts"],
    queryFn: () => fetchJson<{ alerts: MapAlert[] }>("/api/alerts/active"),
    refetchInterval: 25_000,
  });
  const sheltersQ = useQuery({ queryKey: ["shelters"], queryFn: () => fetchJson<{ shelters: MapShelter[] }>("/api/shelters") });

  const filtered = useMemo(
    () => (alertsQ.data?.alerts ?? []).filter((a) => filter === "ALL" || a.disasterType === filter),
    [alertsQ.data, filter]
  );

  const focus = (a: MapAlert) => {
    setSelected(a.id);
    setCenter([a.latitude, a.longitude]);
    setZoom(9);
  };
  const focusShelter = (s: MapShelter) => {
    setSelected(null);
    setCenter([s.latitude, s.longitude]);
    setZoom(11);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Live Disaster Map</h1>
          <p className="text-sm text-muted-foreground">Affected zones (colored), safe perimeters (dashed green), shelters (🏠). Click any marker for details.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded border border-dashed border-amber-500/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-400">
          demo coordinates · simulated feeds
        </span>
      </div>

      {/* filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Disaster filters">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
              filter === f.key ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-300" : "border-border bg-card text-muted-foreground hover:border-cyan-500/30 hover:text-foreground"
            )}
          >
            <span className="mr-1" aria-hidden>{f.emoji}</span>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* map */}
        <div className="relative h-[62vh] min-h-[420px] overflow-hidden rounded-xl border border-border lg:h-[70vh]">
          {alertsQ.isLoading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : (
            <DisasterMap
              alerts={filtered}
              shelters={sheltersQ.data?.shelters ?? []}
              center={center}
              zoom={zoom}
              activeId={selected}
            />
          )}
          {/* legend */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg border border-border bg-card/95 p-3 text-[11px] shadow-xl backdrop-blur">
            <p className="mb-1.5 font-bold uppercase tracking-wide text-muted-foreground">Legend</p>
            <div className="space-y-1">
              {(["CRITICAL", "HIGH", "MODERATE", "LOW"] as Severity[]).map((s) => (
                <p key={s} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SEVERITY_META[s].color }} />
                  {SEVERITY_META[s].label} zone
                </p>
              ))}
              <p className="flex items-center gap-2"><span className="h-2.5 w-6 rounded-full border border-dashed border-emerald-500" /> Safe perimeter</p>
              <p className="flex items-center gap-2"><span aria-hidden>🏠</span> Shelter / evacuation point</p>
            </div>
          </div>
        </div>

        {/* side panel */}
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-0.5">
          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold"><MapPin className="h-4 w-4 text-cyan-400" /> Disasters ({filtered.length})</h2>
            <div className="space-y-2">
              {alertsQ.isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              {filtered.map((a) => {
                const meta = DISASTER_META[(a.disasterType as DisasterType)] ?? DISASTER_META.OTHER;
                const sev = SEVERITY_META[(a.severity as Severity)] ?? SEVERITY_META.MODERATE;
                return (
                  <button
                    key={a.id}
                    onClick={() => focus(a)}
                    className={cn(
                      "w-full rounded-lg border bg-card p-3 text-left transition-all hover:border-cyan-500/40",
                      selected === a.id ? "border-cyan-400/60 bg-cyan-400/5" : "border-border"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.emoji} {meta.label}</span>
                      <span className="text-[10px] font-bold uppercase" style={{ color: sev.color }}>{sev.label}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-sm font-semibold">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground">{a.locationName} · {timeAgo(a.startTime)}</p>
                  </button>
                );
              })}
              {!alertsQ.isLoading && filtered.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No disasters match this filter.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold"><Home className="h-4 w-4 text-emerald-400" /> Shelters & evacuation ({sheltersQ.data?.shelters.length ?? 0})</h2>
            <div className="space-y-2">
              {sheltersQ.data?.shelters.slice(0, 8).map((s) => {
                const occ = Math.round((s.currentLoad / Math.max(1, s.capacity)) * 100);
                return (
                  <button key={s.id} onClick={() => focusShelter(s)} className="w-full rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-emerald-500/40">
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-semibold">{s.name}</p>
                      <span className={cn("text-[10px] font-bold", occ > 85 ? "text-red-400" : occ > 60 ? "text-yellow-400" : "text-emerald-400")}>{occ}%</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{s.city} · capacity {s.capacity}</p>
                  </button>
                );
              })}
            </div>
            <Link href="/dashboard/contacts" className="mt-3 block rounded-lg border border-dashed border-border p-3 text-center text-xs font-semibold text-cyan-400 hover:bg-accent/40">
              Need help? Emergency numbers →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
