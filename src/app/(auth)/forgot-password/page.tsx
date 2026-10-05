"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell, SubmitButton } from "@/components/auth/auth-shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postJson } from "@/lib/fetcher";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await postJson("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a secure reset link">
      {sent ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
          <p className="font-semibold text-emerald-400">Check your inbox</p>
          <p className="mt-1 text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, a password reset link has been sent.
            (Email delivery is <span className="font-semibold">simulated</span> in this demo build — no real email is sent.)
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <SubmitButton loading={loading}>Send reset link</SubmitButton>
          <p className="text-center text-[11px] text-muted-foreground/70">
            Password reset emails are simulated in this prototype. For production, connect an email provider such as SendGrid or SES.
          </p>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-cyan-400 hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
