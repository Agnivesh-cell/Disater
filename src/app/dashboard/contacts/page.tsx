"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Phone, Plus, Star, Trash2, Landmark, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson, postJson } from "@/lib/fetcher";
import { INDIA_EMERGENCY_NUMBERS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Contact { id: string; name: string; relationship: string; phone: string; isPrimary: boolean; notes?: string | null }

export default function ContactsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", relationship: "FAMILY", phone: "", isPrimary: false, notes: "" });

  const { data, isLoading } = useQuery({ queryKey: ["contacts"], queryFn: () => fetchJson<{ contacts: Contact[] }>("/api/emergency-contacts") });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await postJson("/api/emergency-contacts", form);
      toast({ title: "Contact saved ✅", description: `${form.name} added to your emergency network.` });
      setForm({ name: "", relationship: "FAMILY", phone: "", isPrimary: false, notes: "" });
      qc.invalidateQueries({ queryKey: ["contacts"] });
    } catch (err) {
      toast({ title: "Could not save", description: (err as Error).message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string, name: string) => {
    await fetch(`/api/emergency-contacts/${id}`, { method: "DELETE" });
    toast({ title: "Contact removed", description: `${name} deleted.` });
    qc.invalidateQueries({ queryKey: ["contacts"] });
  };

  const setPrimary = async (id: string) => {
    await fetch(`/api/emergency-contacts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPrimary: true }) });
    qc.invalidateQueries({ queryKey: ["contacts"] });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10"><Phone className="h-5 w-5 text-cyan-400" /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Emergency Contacts</h1>
          <p className="text-sm text-muted-foreground">People to reach fast, plus configurable official numbers.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* personal contacts */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">My contacts ({data?.contacts.length ?? 0})</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {isLoading ? (
                [0, 1].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)
              ) : !data?.contacts.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No contacts yet — add family, friends or neighbours below.</p>
              ) : (
                data.contacts.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <a href={`tel:${c.phone}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-600/90 text-white transition-colors hover:bg-emerald-500" aria-label={`Call ${c.name}`}>
                      <Phone className="h-4.5 w-4.5" />
                    </a>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-bold">
                        {c.name}
                        {c.isPrimary && <span className="inline-flex items-center rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-400"><Star className="mr-0.5 h-2.5 w-2.5" />Primary</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{c.relationship.toLowerCase()} · {c.phone}{c.notes ? ` · ${c.notes}` : ""}</p>
                    </div>
                    {!c.isPrimary && (
                      <Button variant="ghost" size="sm" onClick={() => setPrimary(c.id)} aria-label="Set as primary">Make primary</Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => remove(c.id, c.name)} aria-label={`Delete ${c.name}`} className="text-muted-foreground hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Add a contact</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={add} className="space-y-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cname">Name</Label>
                    <Input id="cname" placeholder="Meera Verma" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Relationship</Label>
                    <Select value={form.relationship} onValueChange={(v) => setForm((f) => ({ ...f, relationship: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["FAMILY", "FRIEND", "NEIGHBOR", "OFFICIAL", "OTHER"].map((r) => <SelectItem key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cphone">Phone</Label>
                  <Input id="cphone" type="tel" placeholder="+91 98xxx xxxxx" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <Label htmlFor="primary" className="text-sm">Set as primary contact</Label>
                  <Switch id="primary" checked={form.isPrimary} onCheckedChange={(v) => setForm((f) => ({ ...f, isPrimary: v }))} />
                </div>
                <Button type="submit" disabled={adding} className="w-full font-bold">
                  {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Add contact
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* official numbers */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-4.5 w-4.5 text-cyan-400" /> Official emergency numbers — India</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {INDIA_EMERGENCY_NUMBERS.map((n) => (
              <a key={n.number + n.name} href={`tel:${n.number}`} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:border-cyan-500/40 hover:bg-accent/60">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{n.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.note}</p>
                </div>
                <span className={cn("shrink-0 text-xl font-black", n.number === "112" ? "text-red-400" : "text-cyan-300")}>{n.number}</span>
              </a>
            ))}
            <p className="flex items-start gap-1.5 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
              These numbers are configurable data (not hard-coded) and should be verified against official government sources
              (e.g. ndma.gov.in) before relying on them in a real deployment. Administrators can update this directory.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
