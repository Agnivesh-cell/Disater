"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Leaflet must never run on the server — load client-side only.
export const DisasterMap = dynamic(() => import("./disaster-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center rounded-xl border border-border bg-card">
      <div className="space-y-3 text-center">
        <Skeleton className="mx-auto h-10 w-10 rounded-full" />
        <p className="text-xs text-muted-foreground">Loading live map…</p>
      </div>
    </div>
  ),
});

export type { MapAlert, MapShelter } from "./disaster-map-inner";
