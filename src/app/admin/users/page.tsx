"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Search, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson, postJson } from "@/lib/fetcher";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string; name: string; email: string; role: string; status: string; onboarded: boolean; createdAt: string;
  profile: { city?: string; region?: string; preferredLanguage?: string; notifyInApp: boolean; notifyEmail: boolean; notifyPush: boolean; notifySms: boolean } | null;
  _count: { notifications: number };
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: () => fetchJson<{ users: AdminUser[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`),
  });

  const patch = async (u: AdminUser, body: { status?: string; role?: string }) => {
    setBusyId(u.id);
    try {
      await postJson("/api/admin/users", { userId: u.id, ...body }, "PATCH");
      toast({ title: "User updated", description: `${u.name} → ${body.status ?? body.role}` });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet-400/25 bg-violet-400/10"><Users className="h-5 w-5 text-violet-400" /></span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">User Management</h1>
            <p className="text-sm text-muted-foreground">{data?.users.length ?? "…}"} accounts · roles, regions and alert preferences.</p>
          </div>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Alert prefs</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? [0, 1, 2].map((i) => (
                      <tr key={i}><td colSpan={5} className="px-4 py-3"><Skeleton className="h-10 w-full" /></td></tr>
                    ))
                  : data?.users.map((u) => (
                      <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-accent/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8"><AvatarFallback className="bg-cyan-400/15 text-[11px] font-bold text-cyan-300">{initials(u.name)}</AvatarFallback></Avatar>
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 truncate font-semibold">
                                {u.name}
                                {u.role === "ADMIN" && <Badge className="bg-orange-500/15 text-[9px] font-black uppercase text-orange-400 hover:bg-orange-500/15">Admin</Badge>}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{u.profile?.city ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{u.profile?.region ?? ""} · {u.profile?.preferredLanguage ?? "en"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.profile?.notifyInApp && <Badge variant="outline" className="text-[10px]">In-app</Badge>}
                            {u.profile?.notifyEmail && <Badge variant="outline" className="text-[10px]">Email</Badge>}
                            {u.profile?.notifyPush && <Badge variant="outline" className="text-[10px]">Push</Badge>}
                            {u.profile?.notifySms && <Badge variant="outline" className="text-[10px]">SMS</Badge>}
                            <span className="text-[10px] text-muted-foreground">{u._count.notifications} notif.</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("font-bold", u.status === "ACTIVE" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-red-500/40 bg-red-500/10 text-red-400")}>
                            {u.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            {u.role === "USER" ? (
                              <Button size="sm" variant="outline" disabled={busyId === u.id} onClick={() => patch(u, { role: "ADMIN" })} aria-label="Make admin">
                                {busyId === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" disabled={busyId === u.id} onClick={() => patch(u, { role: "USER" })} aria-label="Make user">
                                <ShieldCheck className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {u.status === "ACTIVE" ? (
                              <Button size="sm" variant="outline" className="text-red-400" disabled={busyId === u.id} onClick={() => patch(u, { status: "SUSPENDED" })}>Suspend</Button>
                            ) : (
                              <Button size="sm" variant="outline" className="text-emerald-400" disabled={busyId === u.id} onClick={() => patch(u, { status: "ACTIVE" })}>Activate</Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <p className="text-center text-[11px] text-muted-foreground/70">
        Role changes and suspensions are recorded in the audit log (AdminAction table).
      </p>
    </div>
  );
}
