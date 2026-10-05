import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { GUIDES, getGuide } from "@/lib/guides";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, PackageCheck, Siren, HeartPulse } from "lucide-react";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  return { title: guide ? guide.title : "Guide" };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const others = GUIDES.filter((g) => g.slug !== slug).slice(0, 4);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/dashboard/preparedness" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Preparedness Center
      </Link>

      <div className="flex items-start gap-4">
        <span className="text-6xl" aria-hidden>{guide.emoji}</span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{guide.title}</h1>
          <p className="mt-1 text-muted-foreground">{guide.summary}</p>
        </div>
      </div>

      {/* warning signs */}
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-amber-400"><AlertTriangle className="h-4.5 w-4.5" /> Warning signs to watch</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
            {guide.warningSigns.map((w) => <li key={w} className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" /> {w}</li>)}
          </ul>
        </CardContent>
      </Card>

      {/* before / during / after */}
      <div className="space-y-4">
        {[
          { data: guide.before, icon: PackageCheck, color: "text-cyan-400", border: "border-cyan-500/30" },
          { data: guide.during, icon: Siren, color: "text-orange-400", border: "border-orange-500/30" },
          { data: guide.after, icon: HeartPulse, color: "text-emerald-400", border: "border-emerald-500/30" },
        ].map(({ data, icon: Icon, color, border }) => (
          <Card key={data.title} className={border}>
            <CardHeader className="pb-2">
              <CardTitle className={`flex items-center gap-2 text-lg ${color}`}><Icon className="h-5 w-5" /> {data.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2.5">
                {data.items.map((item, i) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-[11px] font-black ${color}`}>{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* key do/don't summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-emerald-500/30">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base text-emerald-400"><CheckCircle2 className="h-4.5 w-4.5" /> Golden rule</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Life safety first, property second. When official instructions conflict with this guide, always follow the official instructions.
          </CardContent>
        </Card>
        <Card className="border-red-500/30">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base text-red-400"><XCircle className="h-4.5 w-4.5" /> Never</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Never return to a dangerous area for belongings, and never spread unverified information — share only confirmed official updates.
          </CardContent>
        </Card>
      </div>

      {/* more guides */}
      <div>
        <h2 className="mb-3 text-lg font-bold">More guides</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {others.map((g) => (
            <Link key={g.slug} href={`/dashboard/preparedness/${g.slug}`} className="rounded-xl border border-border bg-card p-3.5 text-center transition-colors hover:border-cyan-500/40">
              <span className="text-2xl" aria-hidden>{g.emoji}</span>
              <p className="mt-1 text-xs font-bold">{g.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
