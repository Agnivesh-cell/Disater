"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import { SEVERITY_META } from "@/lib/constants";

function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  return null;
}

/** Connectivity banner — low-connectivity experience */
function ConnectivityBanner() {
  const online = useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true
  );
  if (online) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[999] bg-amber-500 text-black text-center text-sm font-semibold py-1.5 px-4">
      ⚠ Limited connectivity — showing last available information. Emergency guides and contacts are cached offline.
    </div>
  );
}

/** Real-time alert listener via socket.io mini service + polling fallback */
function AlertRealtimeBridge() {
  const { status } = useSession();
  const pathname = usePathname();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let mounted = true;

    const socket = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      timeout: 8000,
    });
    socketRef.current = socket;

    socket.on("alert:new", (alert: { id?: string; title?: string; severity?: string; isSimulated?: boolean; demo?: boolean; radiusKm?: number; locationName?: string }) => {
      if (!mounted || !alert?.title) return;
      const sev = (alert.severity ?? "MODERATE") as keyof typeof SEVERITY_META;
      const meta = SEVERITY_META[sev] ?? SEVERITY_META.MODERATE;
      toast({
        title: `${meta.label.toUpperCase()} ALERT${alert.isSimulated !== false ? " (DEMO)" : ""}`,
        description: alert.title,
        variant: sev === "CRITICAL" || sev === "HIGH" ? "destructive" : "default",
      });
      if ((sev === "CRITICAL" || sev === "HIGH") && !pathname?.startsWith("/emergency")) {
        // subtle prompt; emergency mode is one tap away
        window.dispatchEvent(new CustomEvent("disasterguard:critical-alert", { detail: alert }));
      }
    });

    // polling fallback every 30s: compare newest active alert id
    let lastKnown: string | null = null;
    const poll = async () => {
      try {
        const res = await fetch("/api/alerts/active");
        if (!res.ok) return;
        const data = await res.json();
        const newest = data.alerts?.[0];
        if (newest && lastKnown && newest.id !== lastKnown && socketRef.current && !socketRef.current.connected) {
          toast({ title: "Alert update available", description: newest.title, variant: newest.severity === "CRITICAL" || newest.severity === "HIGH" ? "destructive" : "default" });
        }
        if (newest) lastKnown = newest.id;
      } catch {
        /* offline — SW cache handles it */
      }
    };
    poll();
    const interval = setInterval(poll, 30_000);

    return () => {
      mounted = false;
      clearInterval(interval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [status, pathname]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 20_000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ServiceWorkerRegistrar />
        <ConnectivityBanner />
        <AlertRealtimeBridge />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
