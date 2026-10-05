"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, Power, Send, Loader2, X, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SeverityBadge, DemoBadge, VerificationBadge } from "@/components/badges";
import { DisasterIcon } from "@/components/alert-card";
import { fetchJson, postJson, fmtDateTime, timeAgo } from "@/lib/fetcher";
import { DISASTER_TYPES, DISASTER_META, SEVERITIES, SEVERITY_META } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AlertRow {
  id: string; disasterType: string; title: string; severity: string; state: string; status: string;
  locationName: string; region: string; latitude: number; longitude: number; radiusKm: number;
  startTime: string; endTime: string | null; source: string; sourceType: string; confidence: number;
  verificationStatus: string; isSimulated: boolean; recommendedActions: string[]; description: string;
  whatHappened?: string | null; whatNext?: string | null; affectedAreas?: string[];
}

const emptyForm = {
  disasterType: "FLOOD", title: "", description: "", severity: "HIGH", locationName: "Lucknow", region: "Lucknow",
  latitude: 26.8467, longitude: 80.9462, radiusKm: 25, endTimeHours: 48, source: "DisasterGuard Alert Console",
  sourceType: "SIMULATED", confidence: 75, isSimulated: true, recommendedActions: "", notifyUsers: true,
};

const CITY_COORDS: Record<string, [number, number, string]> = {
  Lucknow: [26.8467, 80.9462, "Lucknow"],
  Delhi: [28.6139, 77.209, "Delhi"],
  Mumbai: [19.076, 72.8777, "Mumbai"],
  Kolkata: [22.5726, 88.3639, "Kolkata"],
  Chennai: [13.0827, 80.2707, "Chennai"],
  Jaipur: [26.9124, 75.7873, "Jaipur"],
  Dehradun: [30.3165, 78.0322, "Dehradun"],
  Mandi: [31.7085, 76.9314, "Himachal Pradesh"],
};

function AlertsConsole() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(searchParams.get("action") === "create");
  const [editing, setEditing] = useState<AlertRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [notifyFor, setNotifyFor] = useState<AlertRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-alerts-all"],
    queryFn: () => fetchJson<{ alerts: AlertRow[]; total: number }>("/api/alerts?pageSize=50"),
    refetchInterval: 30_000,
  });

  const resetForm = () => { setForm(emptyForm); setEditing(null); setShowForm(false); };

  const openEdit = (a: AlertRow) => {
    setEditing(a);
    setForm({
      disasterType: a.disasterType, title: a.title, description: a.description, severity: a.severity,
      locationName: a.locationName, region: a.region, latitude: a.latitude, longitude: a.longitude,
      radiusKm: a.radiusKm, endTimeHours: 48, source: a.source, sourceType: a.sourceType, confidence: a.confidence,
      isSimulated: a.isSimulated, recommendedActions: a.recommendedActions.join("\n"), notifyUsers: false,
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.title.trim().length < 5) return toast({ title: "Title too short", variant: "destructive" });
    if (form.description.trim().length < 10) return toast({ title: "Description too short", variant: "destructive" });
    setSubmitting(true);
    try {
      if (editing) {
        await postJson(`/api/alerts/${editing.id}`, {
          title: form.title, description: form.description, severity: form.severity, radiusKm: form.radiusKm,
          recommendedActions: form.recommendedActions.split("\n").map((s) => s.trim()).filter(Boolean),
          notifyUsers: form.notifyUsers,
        }, "PATCH");
        toast({ title: "Alert updated ✅", description: form.notifyUsers ? "Subscribers were notified of the change." : undefined });
      } else {
        const endTime = new Date(Date.now() + form.endTimeHours * 3600_000).toISOString();
        await postJson("/api/alerts", {
          disasterType: form.disasterType, title: form.title, description: form.description, severity: form.severity,
          locationName: form.locationName, region: form.region, latitude: Number(form.latitude), longitude: Number(form.longitude),
          radiusKm: Number(form.radiusKm), endTime, source: form.source, sourceType: form.sourceType,
          confidence: Number(form.confidence), isSimulated: form.isSimulated,
          recommendedActions: form.recommendedActions.split("\n").map((s) => s.trim()).filter(Boolean),
          affectedAreas: [], notifyUsers: form.notifyUsers,
        });
        toast({ title: "Alert published ✅", description: form.notifyUsers ? `Notifications fanned out to all users.` : undefined });
      }
      qc.invalidateQueries({ queryKey: ["admin-alerts-all"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      resetForm();
    } catch (err) {
      toast({ title: "Operation failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (a: AlertRow) => {
    const next = a.status === "ACTIVE" ? "RESOLVED" : "ACTIVE";
    await postJson(`/api/alerts/${a.id}`, { status: next, notifyUsers: true }, "PATCH");
    toast({ title: next === "ACTIVE" ? "Alert re-activated" : "Alert resolved", description: a.title });
    qc.invalidateQueries({ queryKey: ["admin-alerts-all"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const changeSeverity = async (a: AlertRow, severity: string) => {
    await postJson(`/api/alerts/${a.id}`, { severity, notifyUsers: false }, "PATCH");
    toast({ title: `Severity → ${severity}`, description: a.title });
    qc.invalidateQueries({ queryKey: ["admin-alerts-all"] });
  };

  const remove = async (a: AlertRow) => {
    await fetch(`/api/alerts/${a.id}`, { method: "DELETE" });
    toast({ title: "Alert deleted", description: a.title });
    qc.invalidateQueries({ queryKey: ["admin-alerts-all"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const sendNotification = async (channels: string[]) => {
    if (!notifyFor) return;
    await postJson("/api/notifications/send", {
      title: `[UPDATE] ${notifyFor.title}`, body: notifyFor.recommendedActions[0] ?? notifyFor.description.slice(0, 140),
      severity: notifyFor.severity, alertId: notifyFor.id, channels,
    });
    toast({ title: "Notification sent", description: `Broadcast via ${channels.join(", ")} (simulated delivery).` });
    setNotifyFor(null);
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const setCity = (city: string) => {
    const c = CITY_COORDS[city];
    setForm((f) => ({ ...f, locationName: city, latitude: c?.[0] ?? f.latitude, longitude: c?.[1] ?? f.longitude, region: c?.[2] ?? city }));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-orange-400/25 bg-orange-400/10"><Bell className="h-5 w-5 text-orange-400" /></span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Alert Management</h1>
            <p className="text-sm text-muted-foreground">{data?.total ?? "…"} alerts on record · create, edit, escalate, resolve.</p>
          </div>
        </div>
        <Button onClick={() => (showForm ? resetForm() : setShowForm(true))} variant={showForm ? "outline" : "default"} className="font-bold">
          {showForm ? <><X className="mr-1.5 h-4 w-4" /> Close</> : <><Plus className="mr-1.5 h-4 w-4" /> Create Alert</>}
        </Button>
      </div>

      {/* create/edit form */}
      {showForm && (
        <Card className="border-cyan-500/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editing ? `Edit alert — ${editing.title.slice(0, 40)}…` : "Create new alert"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Disaster type</Label>
                <Select value={form.disasterType} onValueChange={(v) => setForm((f) => ({ ...f, disasterType: v }))} disabled={!!editing}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DISASTER_TYPES.map((t) => <SelectItem key={t} value={t}>{DISASTER_META[t].emoji} {DISASTER_META[t].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{SEVERITY_META[s].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="atitle">Title</Label>
                <Input id="atitle" placeholder="HIGH FLOOD RISK — Gomti River Rising" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="adesc">Description</Label>
                <textarea id="adesc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Plain-language explanation of the situation…"
                  className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required />
              </div>
              <div className="space-y-1.5">
                <Label>City / location name</Label>
                <Input value={form.locationName} onChange={(e) => setForm((f) => ({ ...f, locationName: e.target.value }))} list="admin-cities" />
                <datalist id="admin-cities">{Object.keys(CITY_COORDS).map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label>Lat</Label>
                  <Input type="number" step="0.0001" value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Lng</Label>
                  <Input type="number" step="0.0001" value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Radius km</Label>
                  <Input type="number" min={1} max={1000} value={form.radiusKm} onChange={(e) => setForm((f) => ({ ...f, radiusKm: parseInt(e.target.value) || 25 }))} />
                </div>
              </div>
              {!editing && (
                <>
                  <div className="space-y-1.5">
                    <Label>Start time</Label>
                    <Input value="Immediately (now)" disabled />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End time (duration)</Label>
                    <Select value={String(form.endTimeHours)} onValueChange={(v) => setForm((f) => ({ ...f, endTimeHours: parseInt(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[6, 12, 24, 48, 72, 96].map((h) => <SelectItem key={h} value={String(h)}>In {h} hours</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Source</Label>
                    <Input value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Source type</Label>
                    <Select value={form.sourceType} onValueChange={(v) => setForm((f) => ({ ...f, sourceType: v, isSimulated: v === "SIMULATED" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["SIMULATED", "OFFICIAL_API", "SENSOR", "COMMUNITY", "MANUAL"].map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label>Confidence: {form.confidence}%</Label>
                <input type="range" min={0} max={100} value={form.confidence} onChange={(e) => setForm((f) => ({ ...f, confidence: parseInt(e.target.value) }))} className="w-full accent-cyan-400" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="aactions">Recommended actions (one per line)</Label>
                <textarea id="aactions" value={form.recommendedActions} onChange={(e) => setForm((f) => ({ ...f, recommendedActions: e.target.value }))}
                  placeholder={"Move to higher ground\nKeep emergency kit ready"}
                  className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 sm:col-span-2">
                <div>
                  <p className="text-sm font-semibold">Notify subscribers immediately</p>
                  <p className="text-xs text-muted-foreground">Fans out to every user&apos;s chosen channels (simulated delivery).</p>
                </div>
                <Switch checked={form.notifyUsers} onCheckedChange={(v) => setForm((f) => ({ ...f, notifyUsers: v }))} aria-label="Notify subscribers" />
              </div>
              {form.sourceType === "SIMULATED" && (
                <p className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-2.5 text-[11px] text-amber-300 sm:col-span-2">
                  Simulated source: this alert will be permanently labelled <b>DEMO / SIMULATED</b> and marked UNVERIFIED.
                </p>
              )}
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={submitting} className="flex-1 font-bold">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editing ? "Save changes" : "Publish alert"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* list */}
      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {data?.alerts.map((a) => (
            <Card key={a.id} className={cn("p-4", a.status === "ACTIVE" && "border-l-4", a.status === "ACTIVE" && (a.severity === "CRITICAL" ? "border-l-red-500" : a.severity === "HIGH" ? "border-l-orange-500" : a.severity === "MODERATE" ? "border-l-yellow-500" : "border-l-emerald-500"))}>
              <div className="flex flex-wrap items-start gap-3">
                <DisasterIcon type={a.disasterType} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={a.severity} />
                    {a.isSimulated && <DemoBadge />}
                    <VerificationBadge status={a.verificationStatus} />
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-black uppercase", a.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground")}>{a.status}</span>
                  </div>
                  <p className="mt-1 truncate font-bold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.locationName} · {a.radiusKm} km · issued {timeAgo(a.startTime)} · {a.source}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Select value={a.severity} onValueChange={(v) => changeSeverity(a, v)}>
                    <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{SEVERITY_META[s].label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => openEdit(a)} aria-label="Edit alert"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => setNotifyFor(a)} aria-label="Send notification"><Send className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => toggleStatus(a)} aria-label={a.status === "ACTIVE" ? "Deactivate" : "Activate"}>
                    <Power className={cn("h-3.5 w-3.5", a.status === "ACTIVE" ? "text-emerald-400" : "text-muted-foreground")} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(a)} aria-label="Delete" className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground/70">window: {fmtDateTime(a.startTime)} → {a.endTime ? fmtDateTime(a.endTime) : "open"}</p>
            </Card>
          ))}
        </div>
      )}

      {/* notify dialog */}
      <Dialog open={!!notifyFor} onOpenChange={(o) => !o && setNotifyFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Send notification</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Broadcast an update about “{notifyFor?.title}” via:</p>
          <div className="grid grid-cols-2 gap-2">
            {[["IN_APP", "In-app"], ["EMAIL", "Email (simulated)"], ["PUSH", "Push (simulated)"], ["SMS", "SMS (simulated)"]].map(([ch, label]) => (
              <Button key={ch} variant="outline" className="font-bold" onClick={() => sendNotification([ch])}>{label}</Button>
            ))}
          </div>
          <Button className="font-bold" onClick={() => sendNotification(["IN_APP", "EMAIL", "PUSH", "SMS"])}>All channels</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminAlertsPage() {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-64 rounded-xl" /></div>}>
      <AlertsConsole />
    </Suspense>
  );
}
