"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, Radio, Eye, MapPin, CloudLightning, Gauge, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { postJson, timeAgo } from "@/lib/fetcher";
import { DISASTER_TYPES, DISASTER_META, SEVERITIES, SEVERITY_META } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DisasterMap, type MapAlert } from "@/components/disaster-map";

const CITIES = ["Lucknow", "Delhi", "Dehradun", "Jaipur", "Mumbai", "Chennai", "Kolkata", "Mandi"];

export default function SimulatePage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ disasterType: "FLOOD", locationName: "Lucknow", severity: "HIGH", radiusKm: 25, durationHours: 24 });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ alertId: string; title: string; notificationsSent: number; createdAt: string } | null>(null);
  const [demoMapAlert, setDemoMapAlert] = useState<MapAlert | null>(null);

  const simulate = async () => {
    setRunning(true);
    setResult(null);
    setDemoMapAlert(null);
    try {
      const res = await postJson<{ alert: MapAlert & { createdAt: string }; notificationsSent: number; demoNotice: string }>("/api/admin/simulate", {
        disasterType: form.disasterType,
        locationName: form.locationName,
        severity: form.severity,
        radiusKm: form.radiusKm,
        durationHours: form.durationHours,
      });
      setResult({ alertId: res.alert.id, title: res.alert.title, notificationsSent: res.notificationsSent, createdAt: res.alert.createdAt });
      setDemoMapAlert(res.alert);
      toast({
        title: "🚨 SIMULATION LIVE",
        description: `${res.alert.title} — broadcast to dashboards, live map & notification center.`,
        variant: "destructive",
      });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-active"] });
      qc.invalidateQueries({ queryKey: ["active-alerts"] });
      qc.invalidateQueries({ queryKey: ["map-alerts"] });
    } catch (e) {
      toast({ title: "Simulation failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const meta = DISASTER_META[form.disasterType as keyof typeof DISASTER_META];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-orange-400/25 bg-orange-400/10"><Zap className="h-5 w-5 text-orange-400" /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Alert Simulation Console</h1>
          <p className="text-sm text-muted-foreground">Trigger a realistic end-to-end demo scenario — every output is permanently labelled DEMO.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* console */}
        <Card className="border-orange-500/40 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><CloudLightning className="h-4.5 w-4.5 text-orange-400" /> Scenario configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Disaster</Label>
              <Select value={form.disasterType} onValueChange={(v) => setForm((f) => ({ ...f, disasterType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISASTER_TYPES.map((t) => <SelectItem key={t} value={t}>{DISASTER_META[t].emoji} {DISASTER_META[t].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Select value={form.locationName} onValueChange={(v) => setForm((f) => ({ ...f, locationName: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <div className="grid grid-cols-4 gap-2">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm((f) => ({ ...f, severity: s }))}
                    className={cn("rounded-lg border px-2 py-2 text-[11px] font-black uppercase transition-all", form.severity === s ? "border-current bg-card" : "border-border text-muted-foreground hover:text-foreground")}
                    style={{ color: form.severity === s ? SEVERITY_META[s].color : undefined }}
                    aria-pressed={form.severity === s}
                  >
                    {SEVERITY_META[s].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Affected radius: {form.radiusKm} km</Label>
                <input type="range" min={5} max={150} value={form.radiusKm} onChange={(e) => setForm((f) => ({ ...f, radiusKm: parseInt(e.target.value) }))} className="w-full accent-cyan-400" aria-label="Radius" />
              </div>
              <div className="space-y-1.5">
                <Label>Duration: {form.durationHours} h</Label>
                <input type="range" min={1} max={96} value={form.durationHours} onChange={(e) => setForm((f) => ({ ...f, durationHours: parseInt(e.target.value) }))} className="w-full accent-cyan-400" aria-label="Duration" />
              </div>
            </div>

            <Button onClick={simulate} disabled={running} className="h-12 w-full bg-orange-600 text-base font-black uppercase tracking-wider hover:bg-orange-500">
              {running ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
              {running ? "Simulating…" : "Simulate Alert"}
            </Button>

            <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
              <b className="text-amber-400">What happens when you click:</b> a DEMO alert is created → real-time broadcast to all
              connected dashboards/maps (socket.io) → notifications fanned out on every user&apos;s channels (simulated delivery) →
              safety status changes on user dashboards. All outputs show <b>DEMO / SIMULATED</b> labels.
            </div>
          </CardContent>
        </Card>

        {/* result panel */}
        <div className="space-y-5 lg:col-span-3">
          {result ? (
            <>
              <Card className="border-red-500/50 bg-red-500/5">
                <CardContent className="p-5">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-red-400">
                    <Radio className="h-4 w-4 blip" /> Demo / simulated alert — live
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold">{meta.emoji} {result.title}</h2>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center sm:max-w-md">
                    <div className="rounded-lg border border-border bg-card p-2.5">
                      <p className="text-lg font-black text-cyan-300">{result.notificationsSent}</p>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Notifications</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-2.5">
                      <p className="text-lg font-black text-cyan-300">{form.radiusKm} km</p>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Radius</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-2.5">
                      <p className="text-lg font-black text-cyan-300">{SEVERITY_META[form.severity as keyof typeof SEVERITY_META].label}</p>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Severity</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild size="sm" className="font-bold"><Link href={`/dashboard/alerts/${result.alertId}`}><Eye className="mr-1.5 h-4 w-4" /> View user view</Link></Button>
                    <Button asChild size="sm" variant="outline" className="font-bold"><Link href="/dashboard/map"><MapPin className="mr-1.5 h-4 w-4" /> See it on the map</Link></Button>
                    <Button asChild size="sm" variant="outline" className="font-bold"><Link href="/emergency">Open Emergency Mode</Link></Button>
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground/70">Issued {timeAgo(result.createdAt)} · realtime fan-out via socket.io + polling fallback</p>
                </CardContent>
              </Card>

              {demoMapAlert && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base"><Gauge className="h-4.5 w-4.5 text-cyan-400" /> Affected area preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MapPreview alert={demoMapAlert} />
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="grid min-h-72 place-items-center border-dashed">
              <CardContent className="py-14 text-center">
                <Zap className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-bold">Ready to simulate</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Configure the scenario and press SIMULATE ALERT — watch it appear instantly on the user dashboard, live map,
                  notification center and Emergency Mode.
                </p>
                <p className="mx-auto mt-3 flex max-w-sm items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> For the 3–5 minute demo: run this, then show the user dashboard + map + Guardian AI.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Small client-only map preview
function MapPreview({ alert }: { alert: MapAlert }) {
  return (
    <div className="h-72 overflow-hidden rounded-xl border border-border">
      <DisasterMap alerts={[alert]} shelters={[]} center={[alert.latitude, alert.longitude]} zoom={8} />
    </div>
  );
}
