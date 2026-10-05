import Link from "next/link";
import { WifiOff, Phone, BookOpenCheck } from "lucide-react";
import { INDIA_EMERGENCY_NUMBERS } from "@/lib/constants";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl border border-amber-500/40 bg-amber-500/10">
        <WifiOff className="h-8 w-8 text-amber-400" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold">Limited connectivity</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        You&apos;re offline. DisasterGuard is showing the last available information cached on your device:
        emergency guides, emergency contacts and the most recent alerts.
      </p>
      <div className="mt-6 grid w-full grid-cols-3 gap-2">
        {INDIA_EMERGENCY_NUMBERS.slice(0, 3).map((n) => (
          <a key={n.number} href={`tel:${n.number}`} className="rounded-xl border border-border bg-card p-3">
            <p className="text-xl font-black text-red-400">{n.number}</p>
            <p className="text-[11px] text-muted-foreground">{n.name.split(" ")[0]}</p>
          </a>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <Link href="/dashboard/preparedness" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-bold text-cyan-400">
          <BookOpenCheck className="h-4 w-4" /> Offline guides
        </Link>
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-bold">
          <Phone className="h-4 w-4" /> Try reconnect
        </Link>
      </div>
    </div>
  );
}
