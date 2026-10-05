"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Siren, Phone, MapPin, Home, Route, CheckCircle2, X, ArrowLeft, Copy, Navigation, AlertTriangle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DisasterMap, type MapAlert, type MapShelter } from "@/components/disaster-map";
import { fetchJson, postJson, timeAgo } from "@/lib/fetcher";
import { INDIA_EMERGENCY_NUMBERS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

type DialogKind = "shelter" | "contacts" | "evacuate" | "location" | "safe" | null;

export default function EmergencyPage() {
  const params = useSearchParams();
  const demoMode = params.get("demo") === "1";
  const { data: session } = useSession();
  const { toast } = useToast();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [safeDone, setSafeDone] = useState(false);
  const [locText, setLocText] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const { data: alertsData } = useQuery({
    queryKey: ["emergency-alerts"],
    queryFn: () => fetchJson<{ alerts: MapAlert[] }>("/api/alerts/active"),
    refetchInterval: 20_000,
  });
  const { data: sheltersData } = useQuery({ queryKey: ["emergency-shelters"], queryFn: () => fetchJson<{ shelters: MapShelter[] }>("/api/shelters") });

  const alerts = alertsData?.alerts ?? [];
  const urgent = alerts.filter((a) => a.severity === "CRITICAL" || a.severity === "HIGH");
  const primary = urgent[0] ?? alerts[0] ?? null;

  // Demo simulation banner state (ref-guarded so the toast fires once)
  const demoNotified = useRef(false);
  useEffect(() => {
    if (demoMode && !demoNotified.current) {
      demoNotified.current = true;
      const t = setTimeout(() => {
        toast({
          title: "🚨 DEMO ALERT — HIGH FLOOD RISK",
          description: "Simulated flood scenario activated for the presentation. This is NOT a real warning.",
          variant: "destructive",
        });
      }, 900);
      return () => clearTimeout(t);
    }
  }, [demoMode, toast]);

  const shareLocation = () => {
    setLocLoading(true);
    if (!navigator.geolocation) {
      setLocText("Geolocation unavailable on this device.");
      setLocLoading(false);
      setDialog("location");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocText(`My location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)\nhttps://maps.google.com/?q=${latitude},${longitude}`);
        setLocLoading(false);
        setDialog("location");
      },
      () => {
        setLocText("Location permission denied. Share your area name with responders instead, or call 112.");
        setLocLoading(false);
        setDialog("location");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const imSafe = async () => {
    const alertId = primary?.id;
    try {
      if (session?.user && alertId) {
        const res = await postJson<{ message: string }>(`/api/alerts/${alertId}/safe`, {});
        toast({ title: "✅ Check-in recorded", description: res.message });
      } else {
        await new Promise((r) => setTimeout(r, 500));
        toast({ title: "✅ You're marked safe (demo)", description: "In production this notifies your emergency contacts by SMS/email." });
      }
      setSafeDone(true);
    } catch (e) {
      toast({ title: "Check-in failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  const evacShelters = (() => {
    if (!primary || !sheltersData) return [];
    return sheltersData.shelters
      .filter((s) => s.city === primary.locationName.split(",")[0].trim() || s.region === primary.region)
      .concat(sheltersData.shelters)
      .filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i)
      .slice(0, 5);
  })();

  const btnBase =
    "group flex h-full min-h-36 w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 p-4 text-center transition-all active:scale-[0.97]";

  return (
    <div className="min-h-screen bg-[#160606] text-white">
      {/* top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-red-500/30 bg-[#1d0808]/95 px-4 py-3 backdrop-blur">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-red-200 hover:text-white" aria-label="Exit emergency mode">
          <ArrowLeft className="h-4 w-4" /> Exit
        </Link>
        <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-red-400">
          <Siren className="h-5 w-5 blip" /> Emergency Mode
        </span>
        <span className="text-xs font-semibold text-red-200/70">DEMO</span>
      </div>

      {/* critical banner */}
      <div className="siren-glow mx-4 mt-4 rounded-2xl border-2 border-red-500 bg-red-950/60 p-4 sm:p-5">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-red-300">
          <AlertTriangle className="h-4 w-4" /> {demoMode ? "Demo simulation active" : urgent.length > 0 ? "Critical alert active" : "No critical alerts right now"}
        </p>
        {demoMode && (
          <>
            <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">⚠️ HIGH FLOOD RISK — LUCKNOW</h1>
            <p className="mt-2 text-sm leading-relaxed text-red-100/90">
              Simulated scenario: Gomti river above warning level. Move to higher ground immediately if you are in a low-lying area.
              This is a demonstration alert — not a real warning.
            </p>
            <p className="mt-2 text-xs font-bold text-red-300">Affected radius: 25 km · Est. duration: 48 hours · Source: DisasterGuard Demo Engine</p>
          </>
        )}
        {!demoMode && primary && (
          <>
            <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{primary.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-red-100/90">
              {primary.recommendedActions?.[0] ?? "Follow instructions from official emergency authorities."}
            </p>
            <p className="mt-2 text-xs font-bold text-red-300">
              {primary.locationName} · {primary.radiusKm} km radius · issued {timeAgo(primary.startTime)} · DEMO DATA
            </p>
          </>
        )}
        {!demoMode && !primary && (
          <h1 className="mt-2 text-xl font-black leading-tight">No active emergencies in tracked regions. Stay prepared.</h1>
        )}
      </div>

      {/* urgent list */}
      {!demoMode && urgent.length > 1 && (
        <div className="mx-4 mt-3 space-y-2">
          {urgent.slice(1).map((a) => (
            <div key={a.id} className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-2.5 text-sm font-semibold">
              {a.severity === "CRITICAL" ? "🔴" : "🟠"} {a.title} <span className="text-xs text-red-200/70">· {a.locationName}</span>
            </div>
          ))}
        </div>
      )}

      {/* big actions */}
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        <a href="tel:112" className={cn(btnBase, "border-red-400/70 bg-red-600/90 hover:bg-red-500")} aria-label="Call 112 emergency help">
          <Phone className="h-9 w-9" />
          <span className="text-lg font-black leading-tight">🆘 SOS<br />Call 112</span>
          <span className="text-[11px] font-semibold opacity-80">Police · Fire · Ambulance</span>
        </a>

        <button onClick={shareLocation} className={cn(btnBase, "border-sky-400/50 bg-sky-900/60 hover:bg-sky-800/60")} aria-label="Share my location">
          {locLoading ? <Loader2 className="h-9 w-9 animate-spin" /> : <MapPin className="h-9 w-9" />}
          <span className="text-lg font-black leading-tight">📍 Share<br />Location</span>
          <span className="text-[11px] font-semibold opacity-70">For responders & family</span>
        </button>

        <button onClick={() => setDialog("shelter")} className={cn(btnBase, "border-emerald-400/50 bg-emerald-900/60 hover:bg-emerald-800/60")} aria-label="Find shelter">
          <Home className="h-9 w-9" />
          <span className="text-lg font-black leading-tight">🏠 Find<br />Shelter</span>
          <span className="text-[11px] font-semibold opacity-70">{sheltersData?.shelters.length ?? "…"} registered</span>
        </button>

        <button onClick={() => setDialog("contacts")} className={cn(btnBase, "border-amber-400/50 bg-amber-900/60 hover:bg-amber-800/60")} aria-label="Emergency contacts">
          <Phone className="h-9 w-9" />
          <span className="text-lg font-black leading-tight">📞 Emergency<br />Contacts</span>
          <span className="text-[11px] font-semibold opacity-70">Family & official lines</span>
        </button>

        <button onClick={() => setDialog("evacuate")} className={cn(btnBase, "border-violet-400/50 bg-violet-900/60 hover:bg-violet-800/60")} aria-label="Evacuation route">
          <Route className="h-9 w-9" />
          <span className="text-lg font-black leading-tight">🗺 Evacuation<br />Route</span>
          <span className="text-[11px] font-semibold opacity-70">Map to nearest shelter</span>
        </button>

        <button
          onClick={imSafe}
          disabled={safeDone}
          className={cn(btnBase, safeDone ? "border-emerald-400 bg-emerald-600/90" : "border-cyan-400/60 bg-cyan-800/70 hover:bg-cyan-700/70")}
          aria-label="Mark me as safe"
        >
          {safeDone ? <CheckCircle2 className="h-9 w-9" /> : <CheckCircle2 className="h-9 w-9" />}
          <span className="text-lg font-black leading-tight">✅ I&apos;m<br />Safe</span>
          <span className="text-[11px] font-semibold opacity-70">{safeDone ? "Check-in recorded" : "Notify your contacts"}</span>
        </button>
      </div>

      {/* quick instructions */}
      <div className="mx-auto max-w-4xl px-4 pb-10">
        <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
          <p className="text-sm font-black uppercase tracking-widest text-white/80">Quick safety instructions</p>
          <ul className="mt-2.5 grid gap-1.5 text-sm text-white/85 sm:grid-cols-2">
            <li>• Stay calm and keep your phone charged</li>
            <li>• Move to higher ground / sturdy shelter</li>
            <li>• Avoid floodwater, wires and damaged structures</li>
            <li>• Follow instructions from official authorities</li>
          </ul>
          <Link href="/dashboard/preparedness" className="mt-3 inline-block text-sm font-bold text-cyan-300 hover:underline">
            Open full safety guides →
          </Link>
          <p className="mt-3 text-[11px] text-white/50">
            Low-connectivity mode: emergency numbers and last-known alerts stay available offline via app cache.
          </p>
        </div>
      </div>

      {/* dialogs */}
      <Dialog open={dialog === "location"} onOpenChange={() => setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-sky-400" /> Share location</DialogTitle></DialogHeader>
          {locText ? (
            <div className="space-y-3">
              <pre className="whitespace-pre-wrap rounded-lg border border-border bg-muted/50 p-3 text-sm">{locText}</pre>
              <Button
                onClick={() => { navigator.clipboard?.writeText(locText).catch(() => undefined); toast({ title: "Copied to clipboard" }); }}
                className="w-full font-bold"
              >
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
              <p className="text-[11px] text-muted-foreground">Your precise location is never stored publicly — this is only for you to share.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Getting your location…</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "shelter" || dialog === "evacuate"} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialog === "evacuate" ? <><Navigation className="h-5 w-5 text-violet-400" /> Evacuation route</> : <><Home className="h-5 w-5 text-emerald-400" /> Find shelter</>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="h-72 overflow-hidden rounded-xl border border-border">
              <DisasterMap
                alerts={demoMode ? [] : primary ? [primary] : []}
                shelters={sheltersData?.shelters ?? []}
                center={primary ? [primary.latitude, primary.longitude] : undefined}
                zoom={9}
              />
            </div>
            {dialog === "evacuate" && (
              <p className="rounded-lg border border-dashed border-violet-500/40 bg-violet-500/5 p-2.5 text-xs text-muted-foreground">
                Map shows affected zone (red) and shelters (🏠). Move <b>away</b> from the colored zone towards the nearest shelter.
                Follow official marked routes — the path shown is indicative only.
              </p>
            )}
            {(dialog === "evacuate" ? evacShelters : sheltersData?.shelters ?? []).slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.address}, {s.city} · {s.facilities.slice(0, 2).join(" · ")}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-emerald-400">{Math.max(0, s.capacity - s.currentLoad)} free</p>
                  {s.contactPhone && <a href={`tel:${s.contactPhone}`} className="text-[11px] text-cyan-400 hover:underline">Call</a>}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "contacts"} onOpenChange={() => setDialog(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-amber-400" /> Emergency contacts</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Official lines (India)</p>
              <div className="grid grid-cols-2 gap-2">
                {INDIA_EMERGENCY_NUMBERS.slice(0, 6).map((n) => (
                  <a key={n.number + n.name} href={`tel:${n.number}`} className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-red-500/50 hover:bg-accent">
                    <p className="text-xl font-black text-red-400">{n.number}</p>
                    <p className="text-[11px] font-semibold leading-tight">{n.name}</p>
                  </a>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">Verify numbers with official government sources — they can change.</p>
            </div>
            {session?.user && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">My contacts</p>
                <MyContactsMini />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MyContactsMini() {
  const [contacts, setContacts] = useState<{ id: string; name: string; phone: string; relationship: string }[] | null>(null);
  useEffect(() => {
    fetchJson<{ contacts: { id: string; name: string; phone: string; relationship: string }[] }>("/api/emergency-contacts")
      .then((d) => setContacts(d.contacts))
      .catch(() => setContacts([]));
  }, []);
  if (contacts === null) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (contacts.length === 0) return (
    <p className="text-sm text-muted-foreground">
      No personal contacts saved. Add them from <Link href="/dashboard/contacts" className="text-cyan-400 underline">Contacts page</Link>.
    </p>
  );
  return (
    <div className="space-y-2">
      {contacts.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{c.name} <span className="text-[10px] font-bold uppercase text-muted-foreground">· {c.relationship}</span></p>
            <p className="truncate text-xs text-muted-foreground">{c.phone}</p>
          </div>
          <a href={`tel:${c.phone}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-600 text-white" aria-label={`Call ${c.name}`}>
            <Phone className="h-4 w-4" />
          </a>
        </div>
      ))}
    </div>
  );
}
