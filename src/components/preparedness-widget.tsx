"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Circle, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

interface ChecklistResponse { items: { itemKey: string; label: string; category: string; checked: boolean }[]; score: number; checked: number; total: number }

export function PreparednessChecklistWidget() {
  const [local, setLocal] = useState<Record<string, boolean>>({});
  const { data, isLoading, refetch } = useQuery({ queryKey: ["preparedness"], queryFn: () => fetchJson<ChecklistResponse>("/api/preparedness") });

  const toggle = async (itemKey: string, current: boolean) => {
    setLocal((p) => ({ ...p, [itemKey]: !current }));
    try {
      await fetch("/api/preparedness/toggle", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemKey, checked: !current }) });
      refetch();
    } catch {
      setLocal((p) => ({ ...p, [itemKey]: current }));
    }
  };

  const score = data?.score ?? 0;
  const message = score >= 90 ? "Excellent — you're ready." : score >= 60 ? "Good progress — keep going." : score >= 30 ? "Getting there — every item counts." : "Start with water and a torch today.";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-400" /> Your emergency readiness</span>
          <span className="text-lg font-black text-cyan-300">{score}<span className="text-sm font-semibold text-muted-foreground">/100</span></span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={score} className="h-2.5" />
        <p className="text-sm text-muted-foreground">{isLoading ? "Loading your checklist…" : message}</p>
        {isLoading ? (
          <div className="grid gap-2 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9" />)}</div>
        ) : (
          <div className="grid gap-1 sm:grid-cols-2">
            {data?.items.map((item) => {
              const checked = local[item.itemKey] ?? item.checked;
              return (
                <button
                  key={item.itemKey}
                  onClick={() => toggle(item.itemKey, checked)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent/60"
                  aria-pressed={checked}
                >
                  {checked ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> : <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />}
                  <span className={cn(checked && "text-muted-foreground line-through")}>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
