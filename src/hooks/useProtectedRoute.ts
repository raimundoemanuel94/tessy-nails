"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export type AllowedRole = "client" | "admin" | "professional";

const PROFESSIONAL_EMAILS = ["tessynails.contato@gmail.com", "tessy@nails.com"];
const SUPERADMIN_EMAILS   = ["raimundoemanuel94@gmail.com"];

export function useProtectedRoute(allowed: AllowedRole | AllowedRole[]) {
  const { user, loading, firestoreLoaded } = useAuth();
  const router   = useRouter();
  const roles    = Array.isArray(allowed) ? allowed : [allowed];
  const didCheck = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (didCheck.current) return;

    if (!user) { router.replace("/login"); return; }

    // Determinar role real: email conhecido OR Firestore carregado
    let effectiveRole = user.role;
    if (SUPERADMIN_EMAILS.includes(user.email ?? "")) effectiveRole = "superadmin";
    else if (PROFESSIONAL_EMAILS.includes(user.email ?? "")) effectiveRole = "professional";
    else if (!firestoreLoaded) return; // aguardar Firestore para usuários desconhecidos

    didCheck.current = true;

    if (!roles.includes(effectiveRole as AllowedRole)) {
      if (effectiveRole === "superadmin") router.replace("/admin");
      else if (effectiveRole === "professional" || effectiveRole === "admin") router.replace("/dashboard");
      else router.replace("/cliente");
    }
  }, [user, loading, firestoreLoaded]);

  return { user, loading };
}
