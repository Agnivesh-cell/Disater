"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { use, useState } from "react";
import {
  ArrowLeft, MapPin, Clock, Target, CheckCircle2, XCircle, Phone, Home, FileText,
  ExternalLink, ShieldAlert, Landmark, Loader2, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DisasterMap } from "@/components/disaster-map";
import { SeverityBadge, DemoBadge, VerificationBadge, SourceChip } from "@/components/badges";
import { DisasterIcon } from "@/components/alert-card";
import { fetchJson, postJson, fmtDateTime, timeAgo } from "@/lib/fetcher";
import { DISASTER_META, type DisasterType } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface DetailResponse {
  alert: {
    id: string; disasterType: string; title: string; description: string; severity: string; state: string; status: string;
    locationName: string; region: string; latitude: number; longitude: number; radiusKm: number;
    startTime: string; endTime: string | null; source: string; sourceType: string; confidence: number;
    verificationStatus: string; isSimulated: boolean;
    recommendedActions: string[]; affectedAreas: string[]; whatHappened: string | null; whatNext: string | null; dos: string[]; donts: string[];
  };
  nearbyShelters: { id: string; name: string; address: string; city: string; distanceKm: number; capacity: number; currentLoad: number; facilities: string[]; contactPhone?: string | null }[];
  communityReports: { id: string; reportType: string; description: string; locationName: string; severity: string; createdAt: string; reporterName: string }[];
}

export default function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [markingSafe, setMarkingSafe] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["alert", id],
    queryFn: () => fetchJson<DetailResponse>(`/api/alerts/${id}`),
  });

  const imSafe = async () => {
    setMarkingSafe(true);
    try {
      const res = await postJson<{ message: string; contactsNotified: number }>(`/api/alerts/${id}/safe`, {});
      toast({ title: "✅ You're marked safe", description: res.message });
    } catch (e) {
      toast({ title: "Could not record check-in", description: (e as Error).message, variant: "destructive" });
    } finally {
      setMarkingSafe(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-52 rounded-xl" />)}</div>
      </div>
    );
  }

  const a = data.alert;
  const meta = DISASTER_META[(a.disasterType as DisasterType)] ?? DISASTER_META.OTHER;
  const isHigh = a.severity === "HIGH" || a.severity === "CRITICAL";

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link href="/dashboard/alerts" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to alerts
      </Link>

      {/* header banner */}
      <Card className={isHigh ? "border-2 border-red-500/40" : undefined}>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <DisasterIcon type={a.disasterType} className="h-12 w-12" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={a.severity} />
                  <DemoBadge label={a.isSimulated ? "DEMO / SIMULATED" : "LIVE DATA"} />
                  <VerificationBadge status={a.verificationStatus} />
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{a.status} · {a.state}</span>
                </div>
                <h1 className="mt-2 text-xl font-extrabold leading-tight sm:text-2xl">{a.title}</h1>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {a.locationName} · {a.region}</span>
                  <span className="inline-flex items-center gap-1"><Target className="h-3.5 w-3.5" /> {a.radiusKm} km affected radius</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Issued {timeAgo(a.startTime)} ({fmtDateTime(a.startTime)})</span>
                  {a.endTime && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Est. duration until {fmtDateTime(a.endTime)}</span>}
                </div>
                <div className="mt-3"><SourceChip source={a.source} sourceType={a.sourceType} confidence={a.confidence} /></div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <Button onClick={imSafe} disabled={markingSafe} className="bg-emerald-600 font-bold hover:bg-emerald-500" size="lg">
                {markingSafe ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-5 w-5" />}
                I&apos;m Safe
              </Button>
              <Button asChild variant="destructive" className="font-bold" size="lg">
                <Link href="/dashboard/reports"><ShieldAlert className="mr-2 h-5 w-5" /> Report Emergency</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* what happened / next */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">🧭 What happened?</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>{a.description}</p>
            {a.whatHappened && <p><span className="font-bold text-foreground">Current situation: </span>{a.whatHappened}</p>}
            {a.affectedAreas.length > 0 && (
              <div>
                <p className="font-bold text-foreground">Affected areas:</p>
                <ul className="mt-1 space-y-1">
                  {a.affectedAreas.map((ar) => <li key={ar} className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" /> {ar}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">🔮 What could happen next?</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            {a.whatNext ? <p>{a.whatNext}</p> : <p>Situation updates will appear here as new data arrives from monitoring providers.</p>}
            <p className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-xs">
              Based on available data and model estimates — not an official forecast. Follow official emergency instructions.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* recommended actions */}
      {a.recommendedActions.length > 0 && (
        <Card className={isHigh ? "border-orange-500/40" : undefined}>
          <CardHeader className="pb-2"><CardTitle className="text-base">✅ What should you do?</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {a.recommendedActions.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-500" /> {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* dos and donts */}
      {(a.dos.length > 0 || a.donts.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {a.dos.length > 0 && (
            <Card className="border-emerald-500/30">
              <CardHeader className="pb-2"><CardTitle className="text-base text-emerald-400">👍 Do</CardTitle></CardHeader>
              <CardContent><ul className="space-y-2 text-sm">{a.dos.map((x) => <li key={x} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {x}</li>)}</ul></CardContent>
            </Card>
          )}
          {a.donts.length > 0 && (
            <Card className="border-red-500/30">
              <CardHeader className="pb-2"><CardTitle className="text-base text-red-400">👎 Do NOT</CardTitle></CardHeader>
              <CardContent><ul className="space-y-2 text-sm">{a.donts.map((x) => <li key={x} className="flex items-start gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /> {x}</li>)}</ul></CardContent>
            </Card>
          )}
        </div>
      )}

      {/* map + shelters */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2"><CardTitle className="text-base">🗺 Risk map</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72 overflow-hidden rounded-lg border border-border">
              <DisasterMap alerts={[a]} shelters={[]} center={[a.latitude, a.longitude]} zoom={8} showShelters={false} />
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Home className="h-4.5 w-4.5 text-emerald-400" /> Nearby shelters</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.nearbyShelters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No registered shelters within range of this alert.</p>
            ) : (
              data.nearbyShelters.map((s) => (
                <div key={s.id} className="rounded-lg border border-border/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{s.name}</p>
                    <span className="text-xs font-semibold text-cyan-300">{s.distanceKm.toFixed(1)} km</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.address}, {s.city}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Capacity {s.currentLoad}/{s.capacity} · {s.facilities.slice(0, 3).join(" · ")}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* emergency contacts + official info */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Phone className="h-4.5 w-4.5 text-cyan-400" /> Emergency contacts</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Emergency", num: "112" },
              { label: "Fire", num: "101" },
              { label: "Ambulance", num: "108" },
              { label: "NDMA", num: "1078" },
            ].map((c) => (
              <a key={c.num} href={`tel:${c.num}`} className="rounded-lg border border-border bg-card p-3 text-center transition-colors hover:border-cyan-500/40 hover:bg-accent">
                <p className="text-lg font-black text-cyan-300">{c.num}</p>
                <p className="text-[11px] text-muted-foreground">{c.label}</p>
              </a>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-4.5 w-4.5 text-cyan-400" /> Official information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <a href="https://ndma.gov.in" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-border/70 p-2.5 hover:bg-accent/60">
              <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> NDMA — National Disaster Management Authority</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
            <a href="https://sachet.ndma.gov.in" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-border/70 p-2.5 hover:bg-accent/60">
              <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> Sachet — NDMA early warning portal</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
            <a href="https://mausam.imd.gov.in" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-border/70 p-2.5 hover:bg-accent/60">
              <span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> IMD — India Meteorological Department</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
            <Separator className="my-2" />
            <p className="text-xs text-muted-foreground">
              DisasterGuard is an informational prototype. Always verify with and follow instructions from official government sources.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* verified community reports */}
      {data.communityReports.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">👥 Verified community reports</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {data.communityReports.map((r) => (
              <div key={r.id} className="rounded-lg border border-border/70 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold capitalize">{r.reportType.replace("_", " ").toLowerCase()} · {r.locationName}</span>
                  <span className="text-[11px] text-muted-foreground">{timeAgo(r.createdAt)}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{r.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
