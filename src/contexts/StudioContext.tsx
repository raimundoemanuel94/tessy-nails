"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { studioService } from "@/services/studio";
import { Studio, PlanId, PlanLimits } from "@/types";

interface StudioContextValue {
  studio:        Studio | null;
  loading:       boolean;
  studioId:      string | null;
  plan:          PlanId;
  isInTrial:     boolean;
  trialDaysLeft: number;
  canUse:        (feature: keyof typeof PlanLimits.free) => boolean;
  refresh:       () => Promise<void>;
}

const StudioContext = createContext<StudioContextValue>({
  studio: null, loading: true, studioId: null,
  plan: "free", isInTrial: false, trialDaysLeft: 0,
  canUse: () => false, refresh: async () => {},
});

export function StudioProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [studio, setStudio]   = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user || user.role !== "professional") {
      setLoading(false); return;
    }
    try {
      const s = await studioService.getByOwner(user.uid);
      setStudio(s);
    } catch { /* silencioso */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [user]);

  const plan          = studio ? studioService.getEffectivePlan(studio) : "free";
  const isInTrial     = studio ? studioService.isInTrial(studio) : false;
  const trialDaysLeft = studio ? studioService.trialDaysLeft(studio) : 0;
  const canUse        = (f: keyof typeof PlanLimits.free) =>
    studio ? studioService.canUseFeature(studio, f) : false;

  return (
    <StudioContext.Provider value={{
      studio, loading,
      studioId: studio?.id ?? null,
      plan, isInTrial, trialDaysLeft,
      canUse, refresh: load,
    }}>
      {children}
    </StudioContext.Provider>
  );
}

export const useStudio = () => useContext(StudioContext);
