import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", size = "md", light = false }: { href?: string; size?: "sm" | "md" | "lg"; light?: boolean }) {
  const dims = size === "lg" ? "h-11 w-11" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <Link href={href} className="flex items-center gap-2.5 group" aria-label="DisasterGuard home">
      <span className={cn("relative grid place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-700 text-white shadow-lg shadow-cyan-500/20", dims)}>
        <ShieldCheck className={size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2.2} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </span>
      <span className={cn("font-bold tracking-tight", text, light ? "text-white" : "text-foreground")}>
        Disaster<span className="text-cyan-400">Guard</span>
      </span>
    </Link>
  );
}
