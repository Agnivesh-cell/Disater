import { AlertTriangle, ShieldCheck, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEVERITY_META, type Severity } from "@/lib/constants";

export function SeverityBadge({ severity, className }: { severity: string; className?: string }) {
  const meta = SEVERITY_META[(severity as Severity)] ?? SEVERITY_META.MODERATE;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
        meta.bg,
        meta.text,
        meta.border,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}

export function DemoBadge({ className, label = "DEMO / SIMULATED" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-dashed border-amber-500/60 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400",
        className
      )}
    >
      <AlertTriangle className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

export function VerificationBadge({ status }: { status: string }) {
  if (status === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
        <BadgeCheck className="h-3 w-3" /> Verified
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-yellow-500/40 bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-400">
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-slate-500/40 bg-slate-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
      Unverified
    </span>
  );
}

export function RiskStatusPill({ level, size = "md" }: { level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL"; size?: "sm" | "md" | "lg" }) {
  const map = {
    LOW: { color: "#22c55e", emoji: "🟢", label: "LOW RISK" },
    MODERATE: { color: "#eab308", emoji: "🟡", label: "MODERATE RISK" },
    HIGH: { color: "#f97316", emoji: "🟠", label: "HIGH RISK" },
    CRITICAL: { color: "#ef4444", emoji: "🔴", label: "CRITICAL RISK" },
  } as const;
  const m = map[level];
  const sizes = { sm: "text-xs px-2 py-0.5", md: "text-sm px-3 py-1", lg: "text-lg px-4 py-1.5" };
  return (
    <span
      className={cn("inline-flex items-center gap-2 rounded-full border font-extrabold uppercase tracking-wider", sizes[size])}
      style={{ color: m.color, borderColor: `${m.color}55`, backgroundColor: `${m.color}18` }}
    >
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", level !== "LOW" && "pulse-ring")} style={{ backgroundColor: m.color, color: m.color }} />
      {m.label}
    </span>
  );
}

export function SourceChip({ source, sourceType, confidence }: { source: string; sourceType?: string; confidence?: number }) {
  const simulated = sourceType === "SIMULATED";
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <ShieldCheck className="h-3 w-3 text-cyan-400" />
        Source: <span className="text-foreground/80 font-medium">{source}</span>
      </span>
      {sourceType && (
        <span className={cn("rounded px-1.5 py-0.5 font-bold uppercase tracking-wide", simulated ? "bg-amber-500/10 text-amber-400 border border-dashed border-amber-500/50" : "bg-emerald-500/10 text-emerald-400")}>
          {sourceType === "SIMULATED" ? "SIMULATED" : sourceType.replace("_", " ")}
        </span>
      )}
      {typeof confidence === "number" && <span>· confidence {confidence}%</span>}
    </div>
  );
}
