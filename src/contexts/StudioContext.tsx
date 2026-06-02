"use client";

/**
 * StudioContext — Hub central multi-tenant
 * Toda página da manicure usa useStudio() para saber:
 * - Qual é o studioId dela
 * - Qual plano está ativo
 * - Se está no trial e quantos dias restam
 * - Se pode usar determinada feature
 */

import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { studioService } from "@/services/studio";
import { settingsService, SalonSettings } from "@/services/settings";
import { Studio, PlanId, PlanLimits } from "@/types";

interface StudioContextValue {
  // Studio
  studio:        Studio | null;
  settings:      SalonSettings | null;
  loading:       boolean;
  error:         string | null;

  // IDs
  studioId:      string | null;

  // Plano
  plan:          PlanId;
  isInTrial:     boolean;
  trialDaysLeft: number;
  trialExpired:  boolean;

  // Feature flags
  canUse: (feature: keyof typeof PlanLimits.free) => boolean;

  // Actions
  refresh:       () => Promise<void>;
  updateSettings:(data: Partial<SalonSettings>) => Promise<void>;
}

const StudioContext = createContext<StudioContextValue>({
  studio: null, settings: null, loading: true, error: null,
  studioId: null, plan: "free", isInTrial: false, trialDaysLeft: 0, trialExpired: false,
  canUse: () => false,
  refresh: async () => {},
  updateSettings: async () => {},
});

export function StudioProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [studio,   setStudio]   = useState<Studio | null>(null);
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Só profissionais têm studio
    if (user.role !== "professional" && user.role !== "admin") {
      setLoading(false); return;
    }

    try {
      setError(null);
      const s = await studioService.getByOwner(user.uid);
      setStudio(s);

      if (s) {
        // Carregar settings em background
        settingsService.get(s.id)
          .then(st => setSettings(st))
          .catch(() => {});
      }
    } catch (e) {
      setError("Erro ao carregar studio");
      console.error("[StudioContext]", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const plan          = studio ? studioService.getEffectivePlan(studio) : "free";
  const isInTrial     = studio ? studioService.isInTrial(studio) : false;
  const trialDaysLeft = studio ? studioService.trialDaysLeft(studio) : 0;
  const trialExpired  = studio
    ? (!studioService.isInTrial(studio) && studio.plan === "free")
    : false;

  const canUse = useCallback(
    (feature: keyof typeof PlanLimits.free) => {
      if (!studio) return false;
      return studioService.canUseFeature(studio, feature);
    },
    [studio]
  );

  const updateSettings = useCallback(async (data: Partial<SalonSettings>) => {
    if (!studio) return;
    await settingsService.save(studio.id, data);
    setSettings(prev => prev ? { ...prev, ...data } : null);
  }, [studio]);

  return (
    <StudioContext.Provider value={{
      studio, settings, loading, error,
      studioId: studio?.id ?? null,
      plan, isInTrial, trialDaysLeft, trialExpired,
      canUse, refresh: load, updateSettings,
    }}>
      {children}
    </StudioContext.Provider>
  );
}

export const useStudio = () => useContext(StudioContext);
