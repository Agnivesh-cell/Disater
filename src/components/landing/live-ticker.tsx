"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchJson, timeAgo } from "@/lib/fetcher";
import { SeverityBadge, DemoBadge } from "@/components/badges";
import { DISASTER_META, type DisasterType } from "@/lib/constants";
import { Radio } from "lucide-react";
import type { AlertLike } from "@/components/alert-card";

// Live alert ticker — publicly visible. Data is DEMO/SIMULATED and labelled.
export function LiveTicker() {
  const { data } = useQuery({
    queryKey: ["landing-active-alerts"],
    queryFn: () => fetchJson<{ alerts: AlertLike[] }>("/api/alerts/active"),
    refetchInterval: 30_000,
  });

  const [idx, setIdx] = useState(0);
  const alerts = (data?.alerts ?? []).slice(0, 8);
  useEffect(() => {
    if (alerts.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % alerts.length), 4000);
    return () => clearInterval(t);
  }, [alerts.length]);

  if (alerts.length === 0) return null;
  const a = alerts[idx % alerts.length];
  const meta = DISASTER_META[(a.disasterType as DisasterType)] ?? DISASTER_META.OTHER;

  return (
    <div className="relative z-10 mx-auto -mt-10 max-w-4xl px-4 sm:px-6">
      <Link
        href="/dashboard/alerts"
        className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card/95 p-3.5 shadow-2xl backdrop-blur transition-colors hover:border-cyan-500/40"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-400/10">
          <Radio className="h-5 w-5 text-cyan-400 blip" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Live now</span>
            <SeverityBadge severity={a.severity} />
            {a.isSimulated !== false && <DemoBadge />}
          </div>
          <p className="truncate text-sm font-semibold">
            <span className="mr-1.5" aria-hidden>{meta.emoji}</span>
            {a.title}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.startTime)}</span>
      </Link>
      <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
        Demo data from the DisasterGuard simulation engine — not real government warnings.
      </p>
    </div>
  );
}
