"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Gauge, Loader2, Sparkles, MapPin, CloudLightning, FlaskConical, Database, BrainCircuit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson, postJson } from "@/lib/fetcher";
import { DISASTER_TYPES, DISASTER_META, RISK_LEVEL_COLORS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface Assessment {
  id?: string;
  locationName: string;
  disasterType: string;
  riskScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  factors: { factor: string; weight: number; basis: string }[];
  recommendedActions: string[];
  generatedBy: string;
  aiNotes: string | null;
  observations: { provider: string; metric: string; value: number; unit: string; dataBasis: string; note?: string }[];
  disclaimer: string;
  generatedAt: string;
}

const EXAMPLES = [
  "Heavy rain since morning, drains overflowing",
  "River rising near warning level, low-lying colony",
  "Dry heat, hot winds for 3 days",
  "New cracks appearing on hillside",
];

export default function RiskAnalyzerPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [location, setLocation] = useState("");
  const [disasterType, setDisasterType] = useState("FLOOD");
  const [conditions, setConditions] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Assessment | null>(null);

  const history = useQuery({
    queryKey: ["risk-history"],
    queryFn: () => fetchJson<{ assessments: unknown[] }>("/api/me"),
    enabled: false,
  });

  const analyze = async () => {
    if (location.trim().length < 2) {
      toast({ title: "Enter a location", description: "City or area name is required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await postJson<{ assessment: Assessment }>("/api/risk-analysis", {
        locationName: location.trim(),
        disasterType,
        conditions: conditions.trim(),
      });
      setResult(res.assessment);
      qc.invalidateQueries({ queryKey: ["risk-history"] });
    } catch (e) {
      toast({ title: "Analysis failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const color = result ? RISK_LEVEL_COLORS[result.riskLevel] : "#22c55e";
  const circumference = 2 * Math.PI * 52;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10"><Gauge className="h-5 w-5 text-cyan-400" /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">AI Disaster Risk Analyzer</h1>
          <p className="text-sm text-muted-foreground">Blend of Guardian AI + deterministic engine over provider observations.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* input */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-base">Assess a situation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="loc">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="loc" className="pl-9" placeholder="e.g. Lucknow" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Disaster type</Label>
              <Select value={disasterType} onValueChange={setDisasterType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISASTER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{DISASTER_META[t].emoji} {DISASTER_META[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cond">Current conditions / observations</Label>
              <textarea
                id="cond"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="Describe what you observe — rainfall, water levels, terrain, anything unusual…"
                className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {EXAMPLES.map((ex) => (
                  <button key={ex} type="button" onClick={() => setConditions(ex)} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-cyan-500/40 hover:text-foreground">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={analyze} disabled={loading} className="w-full font-bold">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {loading ? "Analyzing…" : "Analyze Risk"}
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground/70">
              Output is a <span className="font-semibold">risk estimate</span> built from simulated provider data and model analysis —
              never an official government warning.
            </p>
          </CardContent>
        </Card>

        {/* result */}
        <div className="space-y-4 lg:col-span-3">
          {!result && !loading && (
            <Card className="grid min-h-64 place-items-center border-dashed">
              <CardContent className="py-12 text-center">
                <BrainCircuit className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-bold">No analysis yet</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                  Enter a location and conditions, then let the analyzer score the risk 0–100 with explainable factors.
                </p>
              </CardContent>
            </Card>
          )}
          {loading && (
            <Card><CardContent className="space-y-3 py-8">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> Consulting mock providers and Guardian AI…
              </div>
              <Skeleton className="h-28 w-full" /><Skeleton className="h-24 w-full" />
            </CardContent></Card>
          )}
          {result && (
            <>
              <Card style={{ borderColor: `${color}55` }}>
                <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row">
                  <div className="relative h-32 w-32 shrink-0">
                    <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={circumference * (1 - result.riskScore / 100)}
                        style={{ transition: "stroke-dashoffset 1s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="text-center">
                        <p className="text-3xl font-black" style={{ color }}>{result.riskScore}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">/ 100</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Risk estimate</p>
                    <p className="text-3xl font-black" style={{ color }}>{result.riskLevel} RISK</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {DISASTER_META[result.disasterType as keyof typeof DISASTER_META]?.label} · {result.locationName}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                      <FlaskConical className="h-3 w-3" /> {result.generatedBy}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Risk factors</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {result.factors.map((f) => (
                      <div key={f.factor}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="leading-snug">{f.factor}</span>
                          <span className="shrink-0 font-bold text-orange-400">+{f.weight}</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-red-500" style={{ width: `${Math.min(100, f.weight * 2.2)}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Recommended actions</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {result.recommendedActions.map((a) => (
                        <li key={a} className="flex items-start gap-2">
                          <CloudLightning className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" /> {a}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base"><Database className="h-4.5 w-4.5 text-cyan-400" /> Data sources used</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.observations.map((o) => (
                    <div key={o.metric} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-xs">
                      <span className="text-muted-foreground">{o.provider}</span>
                      <span className="font-semibold">{o.metric.replace(/_/g, " ")}: {o.value} {o.unit}</span>
                      <span className={`rounded px-1.5 py-0.5 font-bold uppercase ${o.dataBasis === "DEMO" ? "bg-amber-500/10 text-amber-400" : o.dataBasis === "VERIFIED_DATA" ? "bg-emerald-500/10 text-emerald-400" : "bg-sky-500/10 text-sky-400"}`}>
                        {o.dataBasis.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                  {result.aiNotes && <p className="pt-1 text-xs italic text-muted-foreground">{result.aiNotes}</p>}
                  <p className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
                    ⚠ {result.disclaimer}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
