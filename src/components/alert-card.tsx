"use client";

import Link from "next/link";
import { MapPin, Clock, ChevronRight, Target, Timer } from "lucide-react";
import { DISASTER_META, type DisasterType } from "@/lib/constants";
import { SeverityBadge, DemoBadge, VerificationBadge, SourceChip } from "@/components/badges";
import { timeAgo } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

export interface AlertLike {
  id: string;
  disasterType: string;
  title: string;
  description?: string;
  severity: string;
  state: string;
  status: string;
  locationName: string;
  region?: string;
  radiusKm?: number;
  startTime: string;
  endTime?: string | null;
  source?: string;
  sourceType?: string;
  confidence?: number;
  verificationStatus?: string;
  isSimulated?: boolean;
  recommendedActions?: string[];
}

export function DisasterIcon({ type, className }: { type: string; className?: string }) {
  const meta = DISASTER_META[(type as DisasterType)] ?? DISASTER_META.OTHER;
  return (
    <span
      className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-lg", className)}
      style={{ backgroundColor: meta.bg, borderColor: `${meta.color}40` }}
      aria-hidden
    >
      {meta.emoji}
    </span>
  );
}

export function AlertCard({ alert, compact = false }: { alert: AlertLike; compact?: boolean }) {
  const meta = DISASTER_META[(alert.disasterType as DisasterType)] ?? DISASTER_META.OTHER;
  const isHigh = alert.severity === "HIGH" || alert.severity === "CRITICAL";

  return (
    <Link
      href={`/dashboard/alerts/${alert.id}`}
      className={cn(
        "group block rounded-xl border bg-card p-4 transition-all hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5",
        isHigh && alert.status === "ACTIVE" ? "border-orange-500/30" : "border-border"
      )}
    >
      <div className="flex items-start gap-3.5">
        <DisasterIcon type={alert.disasterType} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.color }}>
              {meta.label}
            </span>
            <SeverityBadge severity={alert.severity} />
            {alert.isSimulated !== false && <DemoBadge />}
            {alert.verificationStatus && alert.verificationStatus !== "UNVERIFIED" && <VerificationBadge status={alert.verificationStatus} />}
          </div>
          <h3 className="mt-1.5 truncate font-semibold text-foreground group-hover:text-cyan-300 transition-colors">
            {alert.title}
          </h3>
          {!compact && alert.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{alert.description}</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {alert.locationName}
              {alert.radiusKm ? (
                <span className="inline-flex items-center gap-0.5 text-muted-foreground/80">
                  <Target className="ml-1 h-3 w-3" /> {alert.radiusKm} km radius
                </span>
              ) : null}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {timeAgo(alert.startTime)}
            </span>
            {alert.endTime && alert.status === "ACTIVE" && (
              <span className="inline-flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" /> until {timeAgo(alert.endTime)}
              </span>
            )}
            {alert.status !== "ACTIVE" && (
              <span className="rounded bg-muted px-1.5 py-0.5 font-semibold uppercase tracking-wide">{alert.status}</span>
            )}
          </div>
          {!compact && alert.source && (
            <div className="mt-2">
              <SourceChip source={alert.source} sourceType={alert.sourceType} confidence={alert.confidence} />
            </div>
          )}
        </div>
        <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-400" />
      </div>
    </Link>
  );
}
