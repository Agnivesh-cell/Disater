import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json(data as object, { status: init ?? 200 });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { session: null as null, error: fail("Authentication required", 401) };
  const u = session.user as { id?: string; role?: string };
  if (!u.id) return { session: null as null, error: fail("Invalid session", 401) };
  return { session: { id: u.id, role: u.role ?? "USER", name: (session.user as { name?: string }).name ?? "" }, error: null as null };
}

export async function requireAdmin() {
  const r = await requireUser();
  if (r.error) return r;
  if (r.session!.role !== "ADMIN") return { session: null as null, error: fail("Admin access required", 403) };
  return r;
}

export function handleRouteError(e: unknown) {
  if (e instanceof ZodError) {
    const first = e.issues?.[0];
    return fail(first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input", 422);
  }
  console.error("[api] route error:", e);
  return fail("Internal server error", 500);
}

// Basic audit logging
export async function audit(adminId: string | null, action: string, targetType: string, targetId?: string, details?: string) {
  try {
    const { db } = await import("@/lib/db");
    await db.adminAction.create({ data: { adminId, action, targetType, targetId, details } });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}
