// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format, addDays, subDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import type { Appointment } from "@/types/database";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  pending:   "#facc15",
  confirmed: "#4ade80",
  completed: "#a78bfa",
  cancelled: "#f87171",
  no_show:   "#888",
};

export default function AgendaPage() {
  const [date, setDate]         = useState(new Date());
  const [appts, setAppts]       = useState<Appointment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [studioId, setStudioId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getStudio() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("studio_id").eq("id", user.id).single();
      setStudioId((p as { studio_id: string | null } | null)?.studio_id ?? null);
    }
    getStudio();
  }, []);

  useEffect(() => {
    if (!studioId) return;
    load(date);
  }, [studioId, date]);

  async function load(d: Date) {
    setLoading(true);
    const { data } = await supabase.from("appointments").select("*")
      .eq("studio_id", studioId!)
      .gte("appointment_date", startOfDay(d).toISOString())
      .lte("appointment_date", endOfDay(d).toISOString())
      .order("appointment_date");
    setAppts(data ?? []);
    setLoading(false);
  }

  // Week strip
  const week = Array.from({ length: 7 }, (_, i) => subDays(date, 3 - i));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Agenda</h1>
        <Link href="/agendamentos" className="btn-primary text-sm"><Plus size={15} /> Novo</Link>
      </div>

      {/* Week strip */}
      <div className="card p-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setDate(d => subDays(d, 7))} className="btn-ghost p-2"><ChevronLeft size={16} /></button>
          <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
            {format(date, "MMMM yyyy", { locale: ptBR })}
          </span>
          <button onClick={() => setDate(d => addDays(d, 7))} className="btn-ghost p-2"><ChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {week.map(d => {
            const isSelected = isSameDay(d, date);
            const isToday    = isSameDay(d, new Date());
            return (
              <button key={d.toISOString()} onClick={() => setDate(d)}
                className="flex flex-col items-center py-2 rounded-xl text-xs font-bold transition-all"
                style={isSelected
                  ? { background: "var(--brand)", color: "#fff" }
                  : isToday
                  ? { background: "var(--surface2)", color: "var(--brand-light)", border: "1px solid var(--brand)" }
                  : { color: "var(--muted)" }}>
                <span className="text-[10px] opacity-60">{format(d, "EEE", { locale: ptBR }).slice(0,3)}</span>
                <span className="text-base leading-tight">{format(d, "d")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Appointments */}
      <div>
        <p className="text-sm font-bold mb-3" style={{ color: "var(--muted)" }}>
          {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })} • {appts.length} agendamento{appts.length !== 1 ? "s" : ""}
        </p>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={24} style={{ color: "var(--brand)" }} /></div>
        ) : appts.length === 0 ? (
          <div className="card text-center py-8" style={{ color: "var(--muted)" }}>Nenhum agendamento neste dia.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {appts.map(a => (
              <div key={a.id} className="card flex items-center gap-3"
                style={{ borderLeft: `3px solid ${STATUS_COLORS[a.status] ?? "#888"}` }}>
                <div className="w-12 shrink-0 text-center">
                  <p className="text-sm font-black" style={{ color: "var(--brand-light)" }}>
                    {format(new Date(a.appointment_date), "HH:mm")}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>{a.duration_minutes}min</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: "var(--text)" }}>{a.client_name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{a.service_name}</p>
                </div>
                <p className="text-sm font-black shrink-0" style={{ color: "var(--text)" }}>{formatCurrency(a.price)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
