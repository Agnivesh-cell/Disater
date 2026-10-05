"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowRight, Radio, Satellite, BrainCircuit, BellRing, Radar, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";

function RadarViz() {
  const blips = [
    { cx: 38, cy: 30, color: "#22d3ee", d: "0s" },
    { cx: 62, cy: 46, color: "#f97316", d: ".4s" },
    { cx: 46, cy: 66, color: "#22c55e", d: ".8s" },
    { cx: 70, cy: 26, color: "#eab308", d: "1.2s" },
    { cx: 26, cy: 56, color: "#ef4444", d: "1.6s" },
  ];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md" aria-hidden>
      {/* rings */}
      {[100, 75, 50, 25].map((r) => (
        <div
          key={r}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/15"
          style={{ width: `${r}%`, height: `${r}%` }}
        />
      ))}
      {/* crosshair */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-400/10" />
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-cyan-400/10" />
      {/* sweep */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div className="radar-sweep absolute left-1/2 top-1/2 h-1/2 w-1/2 origin-top-left" style={{ transform: "rotate(0deg)" }}>
          <div
            className="h-full w-full rounded-l-full"
            style={{ background: "conic-gradient(from 0deg, rgba(34,211,238,0.5), rgba(34,211,238,0.05) 55deg, transparent 60deg)" }}
          />
        </div>
      </div>
      {/* blips */}
      {blips.map((b, i) => (
        <div key={i} className="blip absolute" style={{ left: `${b.cx}%`, top: `${b.cy}%`, animationDelay: b.d }}>
          <span className="absolute -inset-2.5 rounded-full" style={{ backgroundColor: `${b.color}33`, filter: "blur(6px)" }} />
          <span className="relative block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color, boxShadow: `0 0 12px 2px ${b.color}` }} />
        </div>
      ))}
      {/* center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-400/40 bg-[#0a1626]/90 shadow-2xl shadow-cyan-500/20">
          <Radar className="h-7 w-7 text-cyan-400" />
        </div>
      </div>
      {/* floating chips */}
      <div className="float-slow absolute -right-2 top-6 rounded-xl border border-border bg-card/95 px-3 py-2 text-xs font-semibold shadow-xl backdrop-blur">
        <span className="text-orange-400">⚠ HIGH</span> <span className="text-muted-foreground">Flood · Lucknow</span>
      </div>
      <div className="float-slow absolute -left-3 bottom-10 rounded-xl border border-border bg-card/95 px-3 py-2 text-xs font-semibold shadow-xl backdrop-blur" style={{ animationDelay: "1.4s" }}>
        <span className="text-yellow-400">◉ WATCH</span> <span className="text-muted-foreground">Storm · Delhi</span>
      </div>
      <div className="float-slow absolute -bottom-2 right-10 rounded-xl border border-border bg-card/95 px-3 py-2 text-xs font-semibold shadow-xl backdrop-blur" style={{ animationDelay: "2.4s" }}>
        <span className="text-cyan-400"> shelter</span> <span className="text-muted-foreground">2.1 km · open</span>
      </div>
    </div>
  );
}

export function Hero({ activeCount }: { activeCount: number }) {
  return (
    <section className="relative overflow-hidden">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(34,211,238,0.10),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(6,11,22,0.9))]" />
        <svg className="absolute inset-x-0 bottom-0 h-24 w-full text-background" preserveAspectRatio="none" viewBox="0 0 1200 100">
          <path d="M0,60 C300,110 600,10 1200,55 L1200,100 L0,100 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-28 pt-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-8 lg:pt-24">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-3.5 py-1.5 text-xs font-semibold text-cyan-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            MONITORING ACTIVE · {activeCount} live simulated alert{activeCount === 1 ? "" : "s"}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Get warned <span className="text-cyan-400">before disaster strikes.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            DisasterGuard combines real-time disaster intelligence, risk monitoring and emergency guidance to help
            communities prepare before it is too late.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg" className="h-12 px-6 text-base font-bold shadow-xl shadow-cyan-500/20">
              <Link href="/dashboard/risk-analyzer">
                <MapPinned className="mr-2 h-5 w-5" /> Check Risk Near Me
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-2 px-6 text-base font-bold border-cyan-500/40 bg-transparent text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200">
              <Link href="/dashboard/alerts">
                Explore Live Alerts <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5"><Radio className="h-3.5 w-3.5 text-cyan-400" /> Multi-channel alerting</span>
            <span className="inline-flex items-center gap-1.5"><BrainCircuit className="h-3.5 w-3.5 text-cyan-400" /> AI risk analysis</span>
            <span className="inline-flex items-center gap-1.5"><BellRing className="h-3.5 w-3.5 text-cyan-400" /> Emergency Mode</span>
            <span className="inline-flex items-center gap-1.5"><Satellite className="h-3.5 w-3.5 text-cyan-400" /> Pluggable data feeds</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-[11px] italic text-muted-foreground/70"
          >
            Prototype notice: alerts shown in this build are clearly-labelled DEMO/SIMULATED data, not real warnings.
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
          <RadarViz />
        </motion.div>
      </div>
    </section>
  );
}
