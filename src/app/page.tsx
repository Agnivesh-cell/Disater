import Link from "next/link";
import { Logo } from "@/components/logo";
import { Hero } from "@/components/landing/hero";
import { LiveTicker } from "@/components/landing/live-ticker";
import { HowItWorks, Features } from "@/components/landing/sections";
import { DisasterTypes, Stats, TrustStrip, FinalCTA } from "@/components/landing/disaster-types";
import { getActiveAlerts } from "@/lib/landing-data";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Siren } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const activeCount = await getActiveAlerts();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex" aria-label="Main">
            <a href="/#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="/#disasters" className="transition-colors hover:text-foreground">Disasters</a>
            <a href="/#features" className="transition-colors hover:text-foreground">Features</a>
            <Link href="/emergency" className="inline-flex items-center gap-1.5 text-red-400 transition-colors hover:text-red-300">
              <Siren className="h-4 w-4" /> Emergency
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm" className="font-bold">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Hero activeCount={activeCount} />
        <LiveTicker />
        <HowItWorks />
        <DisasterTypes />
        <Features />
        <Stats />
        <TrustStrip />
        <FinalCTA />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/70 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
            <div className="max-w-sm">
              <Logo />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Know Earlier. Prepare Faster. Stay Safer. An AI-powered disaster early warning, alert & emergency response platform.
              </p>
              <p className="mt-3 inline-flex items-start gap-1.5 text-xs text-muted-foreground/80">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                Prototype build — all alerts are simulated demo data. In an emergency always follow instructions from official authorities.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
              <div>
                <p className="font-bold">Product</p>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
                  <li><Link href="/dashboard/map" className="hover:text-foreground">Live map</Link></li>
                  <li><Link href="/dashboard/risk-analyzer" className="hover:text-foreground">Risk analyzer</Link></li>
                  <li><Link href="/dashboard/assistant" className="hover:text-foreground">Guardian AI</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-bold">Preparedness</p>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  <li><Link href="/dashboard/preparedness" className="hover:text-foreground">Knowledge center</Link></li>
                  <li><Link href="/dashboard/preparedness/flood-safety" className="hover:text-foreground">Flood safety</Link></li>
                  <li><Link href="/dashboard/preparedness/earthquake-safety" className="hover:text-foreground">Earthquake safety</Link></li>
                  <li><Link href="/dashboard/contacts" className="hover:text-foreground">Emergency contacts</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-bold">Official (India)</p>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  <li>112 — National emergency</li>
                  <li>1078 — NDMA helpline</li>
                  <li>108 — Ambulance</li>
                  <li><a href="https://ndma.gov.in" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">ndma.gov.in ↗</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} DisasterGuard · Prototype for demonstration</p>
            <p>Built with Next.js · Prisma · Leaflet · Guardian AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
