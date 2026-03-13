"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClientRedirects() {
  const router = useRouter();

  useEffect(() => {
    // Redirect old client routes to new public routes
    const path = window.location.pathname;
    
    switch (path) {
      case "/cliente":
        router.replace("/");
        break;
      case "/cliente/servicos":
        router.replace("/servicos");
        break;
      case "/cliente/agendar":
        router.replace("/agendar");
        break;
      case "/cliente/agendamentos":
        router.replace("/agendamentos");
        break;
      case "/cliente/perfil":
        router.replace("/perfil");
        break;
      default:
        // For any sub-routes under /cliente, redirect to /
        if (path.startsWith("/cliente/")) {
          router.replace("/");
        }
        break;
    }
  }, [router]);

  return null;
}
