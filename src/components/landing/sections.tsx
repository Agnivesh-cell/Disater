"use client";

import { motion } from "framer-motion";
import { Satellite, Waves, CloudLightning, BellRing, Map, Users, Phone, History, Radio } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Satellite,
    title: "Monitor",
    text: "Data providers — weather, seismic, river gauges, satellite — stream observations into the platform 24/7 through a pluggable integration layer.",
  },
  {
    n: "02",
    icon: Waves,
    title: "Detect",
    text: "AI risk analysis blends provider data, terrain and history to score threats from LOW to CRITICAL. Every estimate is labelled with its data basis.",
  },
  {
    n: "03",
    icon: CloudLightning,
    title: "Alert",
    text: "Understandable alerts with clear, plain-language actions fan out across in-app, email, push and SMS-ready channels in real time.",
  },
  {
    n: "04",
    icon: BellRing,
    title: "Protect",
    text: "People act: evacuation guidance, shelters, Emergency Mode and 'I'm Safe' check-ins close the loop between warning and safety.",
  },
];

const features = [
  { icon: CloudLightning, title: "Real-time alerts", text: "Severity-ranked alerts (LOW → CRITICAL) delivered the moment threats are detected." },
  { icon: Waves, title: "AI risk analysis", text: "Risk scores 0–100 with explainable factors from a blend of AI and deterministic engines." },
  { icon: Map, title: "Location-based warnings", text: "Region + radius geofencing means you only get alerts that can actually reach you." },
  { icon: BellRing, title: "Emergency instructions", text: "Plain-language DOs and DON'Ts for every alert — no jargon under stress." },
  { icon: Radio, title: "Evacuation guidance", text: "Nearby shelters, safe zones and evacuation points surfaced on the live map." },
  { icon: Users, title: "Community reporting", text: "Citizens report hazards with photos; admins verify before anything is published." },
  { icon: Phone, title: "Emergency contacts", text: "One-tap calling and configurable official numbers (India: 112, 101, 108…)." },
  { icon: History, title: "Alert history & analytics", text: "Full audit trail of every alert, plus SaaS analytics for administrators." },
  { icon: Satellite, title: "Multi-channel architecture", text: "In-app, email, push and SMS-ready delivery pipeline — simulated in the demo." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">How it works</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">From raw signals to saved lives</h2>
        <p className="mt-4 text-muted-foreground">
          Four steps turn scattered disaster data into clear, early, actionable warnings for the people who need them.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="relative rounded-2xl border border-border bg-card p-6 transition-colors hover:border-cyan-500/40"
          >
            <span className="absolute right-5 top-5 text-4xl font-black text-muted-foreground/15">{s.n}</span>
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-400/10">
              <s.icon className="h-6 w-6 text-cyan-400" />
            </span>
            <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section id="features" className="border-y border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">Key features</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Everything a community needs to stay ahead</h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.07 }}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 transition-colors group-hover:bg-cyan-400/20">
                <f.icon className="h-5.5 w-5.5 text-cyan-400" />
              </span>
              <h3 className="mt-3.5 font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
