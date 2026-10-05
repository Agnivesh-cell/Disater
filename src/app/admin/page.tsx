"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Bell, AlertOctagon, Users, ClipboardList, Send, Globe, ArrowRight, Zap, ShieldAlert, Radio,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson, timeAgo } from "@/lib/fetcher";
import { AlertCard, type AlertLike } from "@/components/alert-card";

interface Stats {
  activeAlerts: number; criticalAlerts: number; users: number; communityReports: number;
  pendingReports: number; notificationsSent: number; regionsAffected: number;
  latestAlert: { id: string; title: string; severity: string; region: string; startTime: string; isSimulated: boolean } | null;
}

export default function AdminOverviewPage() {
  const { data: session } = useSession();
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetchJson<Stats>("/api/admin/stats"), refetchInterval: 30_000 });
  const alerts = useQuery({ queryKey: ["admin-active"], queryFn: () => fetchJson<{ alerts: AlertLike[] }>("/api/alerts/active?pageSize=6"), refetchInterval: 30_000 });

  const cards = [
    { label: "Active alerts", value: stats.data?.activeAlerts, icon: Bell, color: "text-cyan-400", href: "/admin/alerts" },
    { label: "Critical alerts", value: stats.data?.criticalAlerts, icon: AlertOctagon, color: "text-red-400", href: "/admin/alerts" },
    { label: "Users", value: stats.data?.users, icon: Users, color: "text-violet-400", href: "/admin/users" },
    { label: "Community reports", value: stats.data?.communityReports, icon: ClipboardList, color: "text-amber-400", href: "/admin/reports" },
    { label: "Notifications sent", value: stats.data?.notificationsSent, icon: Send, color: "text-emerald-400", href: "/admin/analytics" },
    { label: "Regions affected", value: stats.data?.regionsAffected, icon: Globe, color: "text-sky-400", href: "/admin/analytics" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-orange-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-orange-400">Emergency Admin</span>
            <span className="text-xs text-muted-foreground">{(session?.user as { email?: string })?.email}</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight">Operations Console</h1>
          <p className="text-sm text-muted-foreground">Monitor the platform, publish verified alerts, and run simulations.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="font-bold">
            <Link href="/admin/alerts?action=create">Create Alert</Link>
          </Button>
          <Button asChild variant="outline" className="border-orange-500/50 font-bold text-orange-300 hover:bg-orange-500/10">
            <Link href="/admin/simulate"><Zap className="mr-1.5 h-4 w-4" /> Simulate</Link>
          </Button>
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="transition-colors hover:border-cyan-500/40">
              <CardContent className="p-4">
                <c.icon className={`h-5 w-5 ${c.color}`} />
                <p className="mt-2.5 text-2xl font-black">{c.value ?? <Skeleton className="h-7 w-10" />}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* latest + active alerts */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold"><Radio className="h-4.5 w-4.5 text-cyan-400" /> Live alert board</h2>
            <Link href="/admin/alerts" className="inline-flex items-center text-sm font-semibold text-cyan-400 hover:underline">
              Manage <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
          {alerts.isLoading ? (
            <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : !alerts.data?.alerts.length ? (
            <Card className="border-dashed"><CardContent className="py-10 text-center text-sm text-muted-foreground">No active alerts. Create or simulate one.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {alerts.data.alerts.slice(0, 5).map((a) => <AlertCard key={a.id} alert={a} compact />)}
            </div>
          )}
        </div>

        {/* side */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="h-4.5 w-4.5 text-amber-400" /> Needs attention</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/reports" className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:border-amber-500/40">
                <span className="text-sm font-semibold">Pending community reports</span>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-sm font-black text-amber-400">{stats.data?.pendingReports ?? "…"}</span>
              </Link>
              {stats.data?.latestAlert && (
                <div className="rounded-lg border border-border p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Latest alert</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold">{stats.data.latestAlert.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {stats.data.latestAlert.region} · {timeAgo(stats.data.latestAlert.startTime)} · {stats.data.latestAlert.isSimulated ? "SIMULATED" : "LIVE"}
                  </p>
                </div>
              )}
              <Link href="/admin/analytics" className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:border-cyan-500/40">
                <span className="text-sm font-semibold">Platform analytics</span>
                <ArrowRight className="h-4 w-4 text-cyan-400" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="p-4 text-xs leading-relaxed text-muted-foreground">
              <p className="font-bold text-foreground">Trust & safety</p>
              Alerts created here are published with source, verification status and confidence. Community reports never
              auto-publish. Simulated alerts are permanently labelled <span className="font-bold text-amber-400">DEMO</span>.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
