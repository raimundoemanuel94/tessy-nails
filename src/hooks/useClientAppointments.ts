"use client";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { appointmentService } from "@/services/appointments";
import { globalStore } from "@/store/globalStore";
import { ensureDate } from "@/lib/utils";
import type { Unsubscribe } from "firebase/firestore";

export interface RealtimeAppointment {
  id: string;
  service: { id:string; name:string; price:number; durationMinutes:number; priceFormatted:string; durationFormatted:string; };
  date: Date; time: { id:string; time:string };
  status: "pending"|"confirmed"|"completed"|"cancelled"|"no_show";
  observation?: string; createdAt: Date;
}

export function useClientAppointments(clientId: string | undefined) {
  const [appointments, setAppointments] = useState<RealtimeAppointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }
    setLoading(true); setError(null);
    let cancelled = false;

    globalStore.fetchServices(false).then((allServices) => {
      if (cancelled) return;
      const svcMap = new Map(allServices.map(s => [s.id, s]));
      unsubRef.current = appointmentService.subscribeByClientId(
        clientId,
        (raw) => {
          if (cancelled) return;
          const mapped: RealtimeAppointment[] = raw
            .filter(a => ["pending","confirmed","completed","cancelled","no_show"].includes(a.status))
            .map(a => {
              const svc  = svcMap.get(a.serviceId);
              const date = ensureDate(a.appointmentDate);
              return {
                id: a.id ?? "",
                service: { id:a.serviceId, name:svc?.name??"Serviço", price:svc?.price??0, durationMinutes:svc?.durationMinutes??60, priceFormatted:svc?`R$ ${svc.price.toFixed(2)}`:"A confirmar", durationFormatted:svc?`${svc.durationMinutes}min`:"—" },
                date, time:{ id:a.id??"", time:format(date,"HH:mm",{locale:ptBR}) },
                status: a.status as RealtimeAppointment["status"],
                observation: a.notes??undefined, createdAt:ensureDate(a.createdAt??new Date()),
              };
            });
          setAppointments(mapped);
          setLoading(false);
        },
        (err) => {
          if (cancelled) return;
          setError((err as {code?:string}).code==="permission-denied" ? "Sem permissão." : "Erro ao sincronizar.");
          setLoading(false);
        }
      );
    }).catch(() => { if(!cancelled){ setError("Erro ao carregar serviços."); setLoading(false); } });

    return () => {
      cancelled = true; unsubRef.current?.(); unsubRef.current = null;
    };
  }, [clientId]);

  return { appointments, loading, error };
}
