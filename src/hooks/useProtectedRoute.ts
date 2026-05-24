"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export type AllowedRole = "client"|"admin"|"professional";

export function useProtectedRoute(allowed: AllowedRole | AllowedRole[]) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const roles = Array.isArray(allowed) ? allowed : [allowed];

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (!roles.includes(user.role as AllowedRole)) {
      router.replace(user.role === "client" ? "/cliente" : "/dashboard");
    }
  }, [user, loading, router]);

  return { user, loading };
}
