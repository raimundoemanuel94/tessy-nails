"use client";

import { useAppVersion } from "@/hooks/useAppVersion";

export function AppVersionWatcher() {
  useAppVersion();
  return null;
}
