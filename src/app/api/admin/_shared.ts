/* eslint-disable */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export async function requireSuperadmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "superadmin") {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { admin: createAdminClient() };
}

export function mapStudioRow(studio: any) {
  return {
    id: studio.id,
    name: studio.name ?? "",
    slug: studio.slug ?? "",
    plan: studio.plan ?? "free",
    isActive: Boolean(studio.is_active),
    ownerId: studio.owner_id ?? null,
    mrr: Number(studio.mrr ?? 0),
    subscriptionStatus: studio.subscription_status ?? null,
    nextBillingDate: studio.next_billing_date ?? null,
    createdAt: studio.created_at ?? null,
    updatedAt: studio.updated_at ?? null,
    trialEndsAt: studio.trial_ends_at ?? null,
  };
}

export function mapServiceRow(service: any) {
  return {
    id: service.id,
    name: service.name ?? "",
    price: Number(service.price ?? 0),
    durationMinutes: Number(service.duration_minutes ?? 0),
    bufferMinutes: Number(service.buffer_minutes ?? 0),
    isActive: Boolean(service.is_active),
  };
}

export function mapSettingsRow(settings: any) {
  if (!settings) return null;

  return {
    slotDuration: Number(settings.slot_duration ?? 30),
    advanceDays: Number(settings.advance_days ?? 30),
    cancelHours: Number(settings.cancel_hours ?? 24),
    autoConfirm: Boolean(settings.auto_confirm),
    workingHours: normalizeWorkingHours(settings.working_hours),
  };
}

export function normalizeWorkingHours(raw: unknown) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, any>) : {};
  const result: Record<string, { open: string; close: string; isOpen: boolean }> = {};

  for (const day of DAYS) {
    const entry = source[day];
    if (!entry) continue;

    result[day] = {
      open: String(entry.open ?? "09:00"),
      close: String(entry.close ?? "18:00"),
      isOpen: Boolean(entry.isOpen ?? entry.is_open ?? false),
    };
  }

  return result;
}
