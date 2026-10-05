import Link from "next/link";
import { ArrowRight, BookOpenCheck, PackageCheck, Siren, HeartPulse } from "lucide-react";
import { GUIDES } from "@/lib/guides";
import { Card, CardContent } from "@/components/ui/card";
import { PreparednessChecklistWidget } from "@/components/preparedness-widget";

export const metadata = { title: "Preparedness Center" };

const phases = [
  { icon: PackageCheck, title: "Before a disaster", text: "Checklists, kits, plans and supplies — the work that pays off later." },
  { icon: Siren, title: "During a disaster", text: "Immediate, simple safety actions when minutes matter." },
  { icon: HeartPulse, title: "After a disaster", text: "Recovery, cleanup safety and getting help." },
];

export default function PreparednessPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10"><BookOpenCheck className="h-5 w-5 text-cyan-400" /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Preparedness Center</h1>
          <p className="text-sm text-muted-foreground">Simple guides in plain language — before, during and after every disaster.</p>
        </div>
      </div>

      {/* readiness widget */}
      <PreparednessChecklistWidget />

      {/* phases */}
      <div className="grid gap-4 sm:grid-cols-3">
        {phases.map((p) => (
          <Card key={p.title}>
            <CardContent className="flex gap-3.5 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10">
                <p.icon className="h-5.5 w-5.5 text-cyan-400" />
              </span>
              <div>
                <h3 className="font-bold">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* guides */}
      <div>
        <h2 className="text-lg font-bold">Disaster-specific guides</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/dashboard/preparedness/${g.slug}`} className="group">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-cyan-500/40">
                <CardContent className="p-5">
                  <span className="text-4xl" aria-hidden>{g.emoji}</span>
                  <h3 className="mt-3 font-bold group-hover:text-cyan-300">{g.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{g.summary}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-cyan-400">
                    Before · During · After <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
