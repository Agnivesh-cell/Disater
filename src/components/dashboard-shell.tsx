"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Map, Bell, BrainCircuit, Sparkles, BookOpenCheck, Users, Phone, Settings, ShieldAlert,
  LogOut, Menu, X, ChevronDown, History, ClipboardList, Gauge,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { fetchJson, timeAgo } from "@/lib/fetcher";
import { SEVERITY_META, type Severity } from "@/lib/constants";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  severity: string;
  read: boolean;
  createdAt: string;
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/map", label: "Live Map", icon: Map },
  { href: "/dashboard/alerts", label: "Alert History", icon: History },
  { href: "/dashboard/risk-analyzer", label: "Risk Analyzer", icon: Gauge },
  { href: "/dashboard/assistant", label: "Guardian AI", icon: Sparkles },
  { href: "/dashboard/preparedness", label: "Preparedness", icon: BookOpenCheck },
  { href: "/dashboard/reports", label: "Community Reports", icon: ClipboardList },
  { href: "/dashboard/contacts", label: "Contacts", icon: Phone },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await fetchJson<{ notifications: NotificationItem[]; unread: number }>("/api/notifications");
        if (!alive) return;
        setItems(data.notifications.slice(0, 6));
        setUnread(data.unread);
      } catch { /* offline */ }
    };
    load();
    const t = setInterval(load, 25_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const markAll = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => undefined);
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card transition-colors hover:bg-accent" aria-label={`Notifications (${unread} unread)`}>
          <Bell className="h-4.5 w-4.5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 pt-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <button onClick={markAll} className="text-[11px] text-cyan-400 hover:underline">Mark all read</button>
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet. You&apos;re all caught up. 🎉</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.map((n) => {
              const sev = SEVERITY_META[(n.severity as Severity)] ?? SEVERITY_META.LOW;
              return (
                <Link
                  key={n.id}
                  href="/dashboard/notifications"
                  onClick={() => setOpen(false)}
                  className={cn("block border-b border-border/60 px-3 py-2.5 transition-colors last:border-0 hover:bg-accent/60", !n.read && "bg-cyan-500/5")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-bold" style={{ color: n.read ? undefined : sev.color }}>{n.title}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                </Link>
              );
            })}
          </div>
        )}
        <DropdownMenuSeparator />
        <Link href="/dashboard/notifications" className="block px-3 py-2 text-center text-xs font-semibold text-cyan-400 hover:underline">
          View all notifications
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCriticalPrompt, setShowCriticalPrompt] = useState(false);

  useEffect(() => {
    const handler = () => setShowCriticalPrompt(true);
    window.addEventListener("disasterguard:critical-alert", handler);
    return () => window.removeEventListener("disasterguard:critical-alert", handler);
  }, []);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const name = session?.user?.name ?? "User";
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border/70 px-4">
        <Logo href="/dashboard" size="sm" />
        <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Dashboard">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-cyan-400/10 text-cyan-300" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        {role === "ADMIN" && (
          <>
            <p className="px-3 pb-1 pt-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Administration</p>
            {[
              { href: "/admin", label: "Admin Overview", icon: ShieldAlert },
              { href: "/admin/alerts", label: "Alert Console", icon: Bell },
              { href: "/admin/reports", label: "Review Reports", icon: Users },
              { href: "/admin/analytics", label: "Analytics", icon: BrainCircuit },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === item.href ? "bg-orange-400/10 text-orange-300" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>
      <div className="border-t border-border/70 p-3">
        <Link
          href="/emergency"
          className="siren-glow flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 text-sm font-extrabold uppercase tracking-wider text-white transition-transform active:scale-[0.98]"
        >
          <ShieldAlert className="h-5 w-5" /> Emergency Mode
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border/70 bg-sidebar lg:block">{sidebar}</aside>
      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-sidebar shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-h-screen w-full flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <button className="grid h-9 w-9 place-items-center rounded-lg border border-border lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live monitoring · demo data
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            {showCriticalPrompt && (
              <Button asChild size="sm" className="hidden bg-red-600 font-bold text-white hover:bg-red-500 sm:inline-flex">
                <Link href="/emergency">Open Emergency Mode</Link>
              </Button>
            )}
            <Button asChild size="sm" variant="destructive" className="font-bold">
              <Link href="/emergency"><ShieldAlert className="mr-1 h-4 w-4" /> SOS</Link>
            </Button>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5 transition-colors hover:bg-accent" aria-label="Account menu">
                  <Avatar className="h-6.5 w-6.5">
                    <AvatarFallback className="bg-cyan-400/15 text-[11px] font-bold text-cyan-300">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-28 truncate text-sm font-medium sm:block">{name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <p className="truncate">{name}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">{session?.user?.email}</p>
                  {role === "ADMIN" && <p className="mt-1 inline-block rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-orange-400">Emergency Admin</p>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/preparedness")}><BookOpenCheck className="mr-2 h-4 w-4" /> Preparedness</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-red-400 focus:text-red-300">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
