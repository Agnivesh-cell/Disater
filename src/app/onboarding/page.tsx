"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MapPin, Bell, CloudLightning, UserRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DISASTER_TYPES, DISASTER_META, LANGUAGES } from "@/lib/constants";
import { postJson } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";

const MAJOR_CITIES = ["Lucknow", "Delhi", "Mumbai", "Kolkata", "Chennai", "Bengaluru", "Hyderabad", "Jaipur", "Dehradun", "Patna", "Kochi", "Guwahati"];

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("en");
  const [ecName, setEcName] = useState("");
  const [ecPhone, setEcPhone] = useState("");
  const [types, setTypes] = useState<string[]>(["FLOOD", "EARTHQUAKE", "STORM"]);
  const [prefs, setPrefs] = useState({ inApp: true, email: true, push: false, sms: false });
  const [geoStatus, setGeoStatus] = useState<"idle" | "ok" | "denied">("idle");

  const detectLocation = () => {
    if (!navigator.geolocation) return setGeoStatus("denied");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCity((c) => c || "Current location");
        setRegion((r) => r || `lat ${pos.coords.latitude.toFixed(3)}, lng ${pos.coords.longitude.toFixed(3)}`);
        setGeoStatus("ok");
        toast({ title: "Location detected", description: "We'll use your area for targeted alerts. Exact location stays private." });
      },
      () => setGeoStatus("denied"),
      { timeout: 8000 }
    );
  };

  const finish = async () => {
    if (!city.trim()) {
      toast({ title: "City required", description: "Tell us where to watch over.", variant: "destructive" });
      setStep(2);
      return;
    }
    setSaving(true);
    try {
      await postJson("/api/onboarding", {
        name: name.trim() || session?.user?.name || undefined,
        city: city.trim(),
        region: (region.trim() || city.trim()),
        preferredLanguage: language,
        emergencyContactName: ecName.trim(),
        emergencyContactPhone: ecPhone.trim(),
        alertTypes: types,
        notifyInApp: prefs.inApp,
        notifyEmail: prefs.email,
        notifyPush: prefs.push,
        notifySms: prefs.sms,
        locationSource: geoStatus === "ok" ? "GEO" : "MANUAL",
      });
      await update({ onboarded: true });
      toast({ title: "You're all set!", description: "Watching over your area now." });
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      toast({ title: "Could not save", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const stepMeta = [
    { icon: UserRound, title: "About you", desc: "Your name and language" },
    { icon: MapPin, title: "Your area", desc: "Where should we watch?" },
    { icon: CloudLightning, title: "Disaster alerts", desc: "Pick the hazards you care about" },
    { icon: Bell, title: "Notifications", desc: "How should we reach you?" },
  ];

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {stepMeta.map((s, i) => (
            <div key={s.title} className={`h-1.5 w-14 rounded-full transition-colors ${i < step ? "bg-cyan-400" : "bg-muted"}`} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">Step {step} of 4</span>
      </div>

      <div className="mt-8 flex-1">
        {step === 1 && (
          <section>
            <h1 className="text-2xl font-extrabold">Welcome{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}! 👋</h1>
            <p className="mt-2 text-sm text-muted-foreground">Let&apos;s personalize your protection. This takes under a minute.</p>
            <div className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" placeholder={session?.user?.name ?? "Aarav Verma"} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Preferred language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Alerts and guides will follow this preference (demo build shows English content).</p>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="text-2xl font-extrabold">Where should we watch over you?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your precise location is never shown publicly — we only use your city/region to target alerts.
            </p>
            <div className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="city">City / town</Label>
                <Input id="city" list="cities" placeholder="Lucknow" value={city} onChange={(e) => setCity(e.target.value)} />
                <datalist id="cities">
                  {MAJOR_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="region">State / region (optional)</Label>
                <Input id="region" placeholder="Uttar Pradesh" value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-semibold">Use my current location</p>
                  <p className="text-xs text-muted-foreground">
                    {geoStatus === "ok" ? "✓ Detected — you can still edit manually" : geoStatus === "denied" ? "Permission unavailable — manual selection is fine" : "More precise area targeting"}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={detectLocation}>Detect</Button>
              </div>
              <div className="space-y-1.5 rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-semibold">Emergency contact (optional)</p>
                <div className="grid gap-3 pt-1 sm:grid-cols-2">
                  <Input placeholder="Contact name" value={ecName} onChange={(e) => setEcName(e.target.value)} />
                  <Input placeholder="Phone number" value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} type="tel" />
                </div>
                <p className="text-xs text-muted-foreground">We&apos;ll notify them (simulated in demo) when you use “I&apos;m Safe”.</p>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="text-2xl font-extrabold">Which disasters should we track for you?</h1>
            <p className="mt-2 text-sm text-muted-foreground">You can change this anytime in Settings.</p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {DISASTER_TYPES.map((t) => {
                const meta = DISASTER_META[t];
                const active = types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypes((prev) => (active ? prev.filter((x) => x !== t) : [...prev, t]))}
                    className={`rounded-xl border p-3.5 text-left transition-all ${active ? "border-cyan-400/60 bg-cyan-400/10" : "border-border bg-card hover:border-cyan-500/30"}`}
                    aria-pressed={active}
                  >
                    <span className="text-xl" aria-hidden>{meta.emoji}</span>
                    <p className="mt-1 text-sm font-semibold">{meta.label}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h1 className="text-2xl font-extrabold">How should we reach you?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              In-app is always on. Email, push and SMS are simulated in this prototype build but stored in your profile.
            </p>
            <div className="mt-8 space-y-3">
              {[
                { key: "inApp" as const, label: "In-app notifications", desc: "Always recommended", locked: true },
                { key: "email" as const, label: "Email alerts", desc: "Simulated delivery in demo" },
                { key: "push" as const, label: "Push notifications", desc: "PWA-ready push architecture" },
                { key: "sms" as const, label: "SMS alerts", desc: "SMS-ready backend (simulated)" },
              ].map((row) => (
                <div key={row.key} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-semibold">{row.label}{row.locked && <span className="ml-2 text-[10px] font-bold uppercase text-cyan-400">recommended</span>}</p>
                    <p className="text-xs text-muted-foreground">{row.desc}</p>
                  </div>
                  <Switch
                    checked={row.locked ? true : prefs[row.key]}
                    disabled={row.locked}
                    onCheckedChange={(v) => setPrefs((p) => ({ ...p, [row.key]: v }))}
                    aria-label={row.label}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 p-4 text-xs text-muted-foreground">
              By continuing you acknowledge DisasterGuard provides informational guidance only and never replaces official
              emergency authorities.
            </div>
          </section>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} className="font-bold">
            Continue <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={finish} disabled={saving} className="font-bold">
            {saving ? "Saving…" : "Finish setup"}
          </Button>
        )}
      </div>
    </div>
  );
}
