"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ClipboardList, Camera, MapPin, Loader2, Info, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson, postJson, timeAgo } from "@/lib/fetcher";
import { REPORT_TYPES, REPORT_STATUSES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Report {
  id: string; reportType: string; description: string; locationName: string;
  severity: string; status: string; createdAt: string; reporterName: string; verified: boolean; reviewNote?: string | null;
}

const TYPE_META: Record<string, { label: string; emoji: string }> = {
  FLOODING: { label: "Flooding", emoji: "🌊" },
  ROAD_BLOCKAGE: { label: "Road blockage", emoji: "🚧" },
  FIRE: { label: "Fire", emoji: "🔥" },
  FALLEN_TREE: { label: "Fallen tree", emoji: "🌳" },
  LANDSLIDE: { label: "Landslide", emoji: "⛰" },
  INFRASTRUCTURE: { label: "Infrastructure damage", emoji: "🏗" },
  OTHER: { label: "Other hazard", emoji: "⚠️" },
};

export default function ReportsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ reportType: "FLOODING", description: "", locationName: "", severity: "MODERATE" });
  const [photo, setPhoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"new" | "mine">("new");

  const mine = useQuery({ queryKey: ["my-reports"], queryFn: () => fetchJson<{ reports: Report[] }>("/api/reports?mine=1") });

  const pickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
      toast({ title: "Unsupported file", description: "Only PNG, JPEG, WebP or GIF images are allowed.", variant: "destructive" });
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      toast({ title: "Photo too large", description: "Please choose an image under 2.5 MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const detectLoc = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setForm((f) => ({ ...f, locationName: f.locationName || `Near ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}` }));
      },
      () => toast({ title: "Location unavailable", description: "Type the location name instead.", variant: "destructive" }),
      { timeout: 8000 }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.description.trim().length < 10) return toast({ title: "Add more detail", description: "Describe what you see (at least 10 characters).", variant: "destructive" });
    if (form.locationName.trim().length < 2) return toast({ title: "Location required", description: "Where is this happening?", variant: "destructive" });
    setSubmitting(true);
    try {
      const res = await postJson<{ message: string }>("/api/reports", {
        ...form,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        photoData: photo,
      });
      toast({ title: "Report submitted ✅", description: res.message });
      setForm({ reportType: "FLOODING", description: "", locationName: "", severity: "MODERATE" });
      setPhoto(null);
      setCoords(null);
      if (fileRef.current) fileRef.current.value = "";
      setTab("mine");
      qc.invalidateQueries({ queryKey: ["my-reports"] });
    } catch (err) {
      toast({ title: "Could not submit", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (s: string) => {
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
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10"><ClipboardList className="h-5 w-5 text-cyan-400" /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Community Reporting</h1>
          <p className="text-sm text-muted-foreground">See something? Report it. Admins verify before anything is published.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(["new", "mine"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-full border px-4 py-1.5 text-sm font-bold transition-colors", tab === t ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-300" : "border-border text-muted-foreground hover:text-foreground")}
          >
            {t === "new" ? "Report a hazard" : "My reports"}
          </button>
        ))}
      </div>

      {tab === "new" ? (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Report type</Label>
                <Select value={form.reportType} onValueChange={(v) => setForm((f) => ({ ...f, reportType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{TYPE_META[t].emoji} {TYPE_META[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Severity (your estimate)</Label>
                <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["LOW", "MODERATE", "HIGH", "CRITICAL"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="loc">Location</Label>
                <div className="flex gap-2">
                  <Input id="loc" placeholder="Street / landmark / area" value={form.locationName} onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))} />
                  <Button type="button" variant="outline" onClick={detectLoc} className="shrink-0"><MapPin className="mr-1.5 h-4 w-4" /> Detect</Button>
                </div>
                {coords && <p className="text-[11px] text-emerald-400">✓ GPS attached ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}) — not shown publicly</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="desc">What do you see?</Label>
                <textarea
                  id="desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the hazard: how deep is the water? Is the road passable? Any danger to people?"
                  className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Photo (optional)</Label>
                {photo ? (
                  <div className="relative w-fit">
                    <img src={photo} alt="Report attachment preview" className="h-36 rounded-lg border border-border object-cover" />
                    <button type="button" onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-white" aria-label="Remove photo">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground transition-colors hover:border-cyan-500/40 hover:text-foreground">
                    <Camera className="h-5 w-5" /> Attach photo (max 2.5 MB, validated)
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
                  </label>
                )}
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={submitting} className="w-full font-bold">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit report
                </Button>
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  Reports start as <b>PENDING</b> and only appear publicly after an administrator verifies them. This prevents
                  unverified information from being mistaken for confirmed disasters. In life-threatening situations call 112 first.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">My submitted reports</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {mine.isLoading ? (
              [0, 1].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)
            ) : !mine.data?.reports.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">You haven&apos;t reported anything yet.</p>
            ) : (
              mine.data.reports.map((r) => (
                <div key={r.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold">{TYPE_META[r.reportType]?.emoji} {TYPE_META[r.reportType]?.label ?? r.reportType}</span>
                    <div className="flex items-center gap-2">{statusBadge(r.status)}<span className="text-[11px] text-muted-foreground">{timeAgo(r.createdAt)}</span></div>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{r.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">📍 {r.locationName} · severity: {r.severity.toLowerCase()}</p>
                  {r.reviewNote && <p className="mt-1.5 rounded bg-muted/60 px-2.5 py-1.5 text-xs italic">Admin note: {r.reviewNote}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
