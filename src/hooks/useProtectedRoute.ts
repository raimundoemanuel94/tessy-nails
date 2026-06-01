"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export type AllowedRole = "client" | "admin" | "professional";

export function useProtectedRoute(allowed: AllowedRole | AllowedRole[]) {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const roles    = Array.isArray(allowed) ? allowed : [allowed];
  const didCheck = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (didCheck.current) return; // evitar loops de redirect no iOS
    didCheck.current = true;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!roles.includes(user.role as AllowedRole)) {
      router.replace(user.role === "client" ? "/cliente" : "/dashboard");
    }
  }, [user, loading]);

  return { user, loading };
}
