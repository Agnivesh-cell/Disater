"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Settings, Loader2, MapPin, Bell, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchJson, postJson } from "@/lib/fetcher";
import { DISASTER_TYPES, DISASTER_META, LANGUAGES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Me {
  name: string; email: string; role: string;
  profile: { city?: string; region?: string; preferredLanguage?: string; phone?: string; emergencyContactName?: string; emergencyContactPhone?: string; notifyInApp: boolean; notifyEmail: boolean; notifyPush: boolean; notifySms: boolean };
  alertSubscriptions: { disasterType: string }[];
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<string[]>([]);
  const [prefs, setPrefs] = useState({ inApp: true, email: true, push: false, sms: false });
  const [profile, setProfile] = useState({ name: "", city: "", region: "", phone: "", language: "en" });

  useEffect(() => {
    fetchJson<Me>("/api/me").then((d) => {
      setMe(d);
      setTypes(d.alertSubscriptions.map((s) => s.disasterType));
      setPrefs({
        inApp: d.profile.notifyInApp, email: d.profile.notifyEmail, push: d.profile.notifyPush, sms: d.profile.notifySms,
      });
      setProfile({
        name: d.name, city: d.profile.city ?? "", region: d.profile.region ?? "", phone: d.profile.phone ?? "", language: d.profile.preferredLanguage ?? "en",
      });
    }).catch(() => undefined);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await postJson("/api/me", {
        name: profile.name,
        city: profile.city,
        region: profile.region,
        phone: profile.phone,
        preferredLanguage: profile.language,
        notifyInApp: prefs.inApp,
        notifyEmail: prefs.email,
        notifyPush: prefs.push,
        notifySms: prefs.sms,
        alertTypes: types,
      }, "PATCH");
      await update({ onboarded: true });
      toast({ title: "Settings saved ✅", description: "Your alert preferences are updated." });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!me) {
    return <div className="mx-auto max-w-3xl space-y-4 p-6"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10"><Settings className="h-5 w-5 text-cyan-400" /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">{me.email} · {me.role === "ADMIN" ? "Emergency admin" : "Citizen account"}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4.5 w-4.5 text-cyan-400" /> Profile</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pname">Name</Label>
            <Input id="pname" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pphone">Phone</Label>
            <Input id="pphone" type="tel" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pcity">City</Label>
            <Input id="pcity" value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pregion">State / region</Label>
            <Input id="pregion" value={profile.region} onChange={(e) => setProfile((p) => ({ ...p, region: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Preferred language</Label>
            <Select value={profile.language} onValueChange={(v) => setProfile((p) => ({ ...p, language: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4.5 w-4.5 text-cyan-400" /> Notification channels</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "inApp" as const, label: "In-app notifications", desc: "Recommended", locked: true },
            { key: "email" as const, label: "Email alerts", desc: "Simulated delivery in this build" },
            { key: "push" as const, label: "Push notifications", desc: "PWA push-ready architecture" },
            { key: "sms" as const, label: "SMS alerts", desc: "SMS-ready backend (simulated)" },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold">{row.label}</p>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4.5 w-4.5 text-cyan-400" /> Alert subscriptions ({types.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DISASTER_TYPES.map((t) => {
              const active = types.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => setTypes((prev) => (active ? prev.filter((x) => x !== t) : [...prev, t]))}
                  className={cn("rounded-full border px-3 py-1.5 text-xs font-bold transition-colors", active ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-300" : "border-border text-muted-foreground hover:text-foreground")}
                  aria-pressed={active}
                >
                  {DISASTER_META[t].emoji} {DISASTER_META[t].label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/" })} className="text-red-400 hover:text-red-300">Sign out</Button>
        <Button onClick={save} disabled={saving} className="font-bold">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save changes
        </Button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground/70">
        Your precise location is never exposed publicly. Sessions are JWT-based; passwords hashed with bcrypt.
        {session?.user?.role === "ADMIN" ? " You have admin privileges — use them responsibly." : ""}
      </p>
    </div>
  );
}
