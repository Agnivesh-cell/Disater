"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { AuthShell, SubmitButton, useDemoLogin, OAuthPlaceholder } from "@/components/auth/auth-shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function LoginForm() {
  const { login, loading } = useDemoLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Enter your email and password.");
    await login(email, password, "form");
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your DisasterGuard account">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-cyan-400 hover:underline">Forgot password?</Link>
          </div>
          <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <SubmitButton loading={!!loading}>Sign in</SubmitButton>
      </form>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <Separator className="flex-1" />
      </div>
      <OAuthPlaceholder />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-cyan-400 hover:underline">
          Create a free account
        </Link>
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-cyan-500/40 bg-cyan-500/5 p-3.5 text-xs">
        <p className="font-bold text-cyan-300">Demo accounts</p>
        <div className="mt-2 grid gap-1.5">
          <button
            type="button"
            onClick={() => login("demo@disasterguard.app", "Demo@123", "demo")}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-cyan-500/40 disabled:opacity-60"
            disabled={!!loading}
          >
            <span><span className="font-semibold">Citizen demo</span> · demo@disasterguard.app</span>
            <span className="text-cyan-400">{loading === "demo" ? "Signing in…" : "Use →"}</span>
          </button>
          <button
            type="button"
            onClick={() => login("admin@disasterguard.app", "Admin@123", "admin")}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:border-cyan-500/40 disabled:opacity-60"
            disabled={!!loading}
          >
            <span><span className="font-semibold">Emergency admin</span> · admin@disasterguard.app</span>
            <span className="text-cyan-400">{loading === "admin" ? "Signing in…" : "Use →"}</span>
          </button>
        </div>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
