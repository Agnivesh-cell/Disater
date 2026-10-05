"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Mail, MessageSquare, Smartphone, BellRing, CheckCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson, timeAgo } from "@/lib/fetcher";
import { SEVERITY_META, type Severity } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string; title: string; body: string; channel: string; severity: string; read: boolean; deliveryStatus: string; createdAt: string; alert?: { id: string; isSimulated: boolean } | null;
}

const CHANNEL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  IN_APP: BellRing,
  EMAIL: Mail,
  PUSH: Smartphone,
  SMS: MessageSquare,
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications-page"],
    queryFn: () => fetchJson<{ notifications: NotificationItem[]; unread: number }>("/api/notifications"),
    refetchInterval: 25_000,
  });

  const markAll = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    qc.invalidateQueries({ queryKey: ["notifications-page"] });
    qc.invalidateQueries({ queryKey: ["me"] });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10"><Bell className="h-5 w-5 text-cyan-400" /></span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Notification Center</h1>
            <p className="text-sm text-muted-foreground">{data?.unread ?? 0} unread · in-app channel (email/push/SMS deliveries are simulated)</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={markAll} className="font-bold"><CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : !data?.notifications.length ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 font-bold">No notifications yet</p>
            <p className="text-sm text-muted-foreground">Alert notifications will appear here the moment they are issued.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {data.notifications.map((n) => {
            const sev = SEVERITY_META[(n.severity as Severity)] ?? SEVERITY_META.LOW;
            const Icon = CHANNEL_ICON[n.channel] ?? Bell;
            return (
              <Card key={n.id} className={cn("p-4 transition-colors", !n.read && "border-cyan-500/40 bg-cyan-500/5")}>
                <div className="flex gap-3">
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg border", !n.read ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-400" : "border-border bg-muted text-muted-foreground")}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <p className="text-sm font-bold" style={{ color: n.read ? undefined : sev.color }}>{n.title}</p>
                      <span className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)} · {n.channel} · {n.deliveryStatus}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground/70">
        Multi-channel architecture: IN_APP is live; EMAIL/PUSH/SMS deliveries are recorded as simulated (SENT) in this prototype.
        Connect real providers (SendGrid, FCM, Twilio) to activate them.
      </p>
    </div>
  );
}
