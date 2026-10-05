"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthShell, SubmitButton, OAuthPlaceholder } from "@/components/auth/auth-shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { postJson } from "@/lib/fetcher";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.name.trim().length < 2) return setError("Please enter your full name.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await postJson("/api/auth/register", { name: form.name.trim(), email: form.email.trim(), password: form.password });
      // auto sign-in after registration
      const res = await signIn("credentials", { email: form.email.trim(), password: form.password, redirect: false });
      if (res?.error) throw new Error("Account created — please sign in manually.");
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "Could not create account. Try another email?");
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Free forever for citizens and communities">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Aarav Verma" value={form.name} onChange={set("name")} autoComplete="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} autoComplete="email" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Min 8 characters" value={form.password} onChange={set("password")} autoComplete="new-password" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm</Label>
            <Input id="confirm" type="password" placeholder="Repeat password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" required />
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>
      <OAuthPlaceholder />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-cyan-400 hover:underline">Sign in</Link>
      </p>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/70">
        By creating an account you agree that DisasterGuard provides informational guidance only and is not a substitute
        for official emergency services.
      </p>
    </AuthShell>
  );
}
