"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Activity, ShieldCheck, TriangleAlert, ArrowRight } from "lucide-react";
import { DISASTER_META, type DisasterType } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const types: DisasterType[] = ["FLOOD", "CYCLONE", "EARTHQUAKE", "WILDFIRE", "STORM", "EXTREME_RAIN", "HEATWAVE", "LANDSLIDE"];

export function DisasterTypes() {
  return (
    <section id="disasters" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">Coverage</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">One platform for every hazard</h2>
        <p className="mt-4 text-muted-foreground">
          From rivers to coastlines to hills — DisasterGuard tracks the disasters that threaten your region.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {types.map((t, i) => {
          const meta = DISASTER_META[t];
          return (
            <motion.div
              key={t}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: (i % 4) * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-cyan-500/40"
            >
              <div
                className="pointer-events-none absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-50"
                style={{ backgroundColor: meta.color }}
                aria-hidden
              />
              <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl text-3xl" style={{ backgroundColor: meta.bg }}>
                {meta.emoji}
              </span>
              <h3 className="relative mt-3 font-bold">{meta.label}</h3>
              <p className="relative mt-1 hidden text-xs leading-relaxed text-muted-foreground sm:block">{meta.description}</p>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Plus tsunami, lightning, industrial accidents and other regional emergency categories.
      </p>
    </section>
  );
}

const stats = [
  { value: "24/7", label: "Monitoring", note: "Always-on data provider pipeline" },
  { value: "8+", label: "Disaster categories", note: "Floods to landslides to heatwaves" },
  { value: "3", label: "Risk levels + watch", note: "LOW · MODERATE · HIGH · CRITICAL" },
  { value: "4-ch", label: "Alert channels", note: "In-app · Email · Push · SMS-ready" },
];

export function Stats() {
  return (
    <section className="border-y border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="text-center"
            >
              <p className="bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">{s.value}</p>
              <p className="mt-1.5 font-bold">{s.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>
            </motion.div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] leading-relaxed text-muted-foreground/70">
          <TriangleAlert className="mr-1 inline h-3 w-3" />
          Platform capabilities and demo metrics for this prototype build. All counts and alerts shown in-app are simulated demo data and
          clearly labelled as such — they do not represent real-time government statistics.
        </p>
      </div>
    </section>
  );
}

const trust = [
  { icon: ShieldCheck, title: "Every alert has a source", text: "Origin, confidence % and verification status shown on every alert." },
  { icon: Activity, title: "Simulated ≠ real", text: "Demo data is permanently labelled “DEMO / SIMULATED” — never passed off as real." },
  { icon: TriangleAlert, title: "Authorities come first", text: "Guardian AI never replaces official emergency instructions or predictions." },
];

export function TrustStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid gap-4 md:grid-cols-3">
        {trust.map((t) => (
          <div key={t.title} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10">
              <t.icon className="h-5 w-5 text-cyan-400" />
            </span>
            <div>
              <h3 className="font-bold">{t.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_50%,rgba(34,211,238,0.12),transparent_70%)]" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Be prepared before the warning <span className="text-cyan-400">becomes an emergency.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Create a free account, set your region and alert preferences, and let DisasterGuard watch over your community.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-7 text-base font-bold shadow-xl shadow-cyan-500/20">
            <Link href="/signup">
              Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 border-cyan-500/40 bg-transparent px-7 text-base font-bold text-cyan-300 hover:bg-cyan-500/10">
            <Link href="/emergency?demo=1">Try Emergency Simulation</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
