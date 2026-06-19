import { NextResponse } from "next/server";

type Entry = { count: number; firstAt: number };
const store = new Map<string, Entry>();
const CLEANUP_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now - entry.firstAt > windowMs) store.delete(key);
  }
}

export function extractIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function isAllowed(key: string, limit: number, windowMs: number): boolean {
  cleanup(windowMs);
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now - entry.firstAt > windowMs) {
    store.set(key, { count: 1, firstAt: now });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function rateLimitResponse() {
  return NextResponse.json(
    { error: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente." },
    { status: 429 },
  );
}
