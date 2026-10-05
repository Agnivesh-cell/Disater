"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Github, Chrome, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Simple email/password auth for the prototype. Google OAuth is structured in
// the auth config but requires real GOOGLE_CLIENT_ID/SECRET env values.
export function useDemoLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const login = async (email: string, password: string, tag: string) => {
    setLoading(tag);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(null);
    if (res?.error) {
      toast({ title: "Sign in failed", description: "Invalid email or password.", variant: "destructive" });
      return false;
    }
    toast({ title: "Welcome back!", description: "Signed in successfully." });
    router.push(callbackUrl);
    router.refresh();
    return true;
  };

  return { login, loading, callbackUrl };
}

export function OAuthPlaceholder() {
  return (
    <div className="grid grid-cols-2 gap-3 opacity-60">
      <Button type="button" variant="outline" disabled className="gap-2" title="Requires GOOGLE_CLIENT_ID in .env">
        <Chrome className="h-4 w-4" /> Google
      </Button>
      <Button type="button" variant="outline" disabled className="gap-2" title="Not enabled in prototype">
        <Github className="h-4 w-4" /> GitHub
      </Button>
    </div>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" className="h-11 w-full font-bold" disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

export function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,rgba(34,211,238,0.10),transparent_70%)]" aria-hidden />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 block text-center">
          <span className="font-extrabold text-2xl tracking-tight">
            Disaster<span className="text-cyan-400">Guard</span>
          </span>
          <span className="sr-only">DisasterGuard home</span>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
