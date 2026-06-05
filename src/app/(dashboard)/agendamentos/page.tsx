// @ts-nocheck
"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Loader2, CalendarDays, Filter } from "lucide-react";
import type { Appointment, Service, Client } from "@/types/database";
import { format, startOfDay, endOfDay, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; cls: string; next?: string }> = {
  pending:   { label: "Pendente",   cls: "badge-yellow", next: "confirmed" },
  confirmed: { label: "Confirmado", cls: "badge-green",  next: "completed" },
  completed: { label: "Concluído",  cls: "badge-purple" },
  cancelled: { label: "Cancelado",  cls: "badge-red"    },
  no_show:   { label: "Faltou",     cls: "badge-gray"   },
};

export default function AgendamentosPage() {
  const [appts, setAppts]       = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients]   = useState<Client[]>([]);
  const [loading, setLoading]   = useState(true);
  const [studioId, setStudioId] = useState<string | null>(null);
  const [filter, setFilter]     = useState<string>("all");
  const [dateRange, setDateRange] = useState<"today"|"week"|"month">("today");
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);

  const [selService, setSelService] = useState("");
  const [selClient, setSelClient]   = useState("");
  const [dateInput, setDateInput]   = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeInput, setTimeInput]   = useState("09:00");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes]           = useState("");

  const supabase = createClient();

  useEffect(() => { load(); }, [dateRange]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profileRaw } = await supabase.from("profiles").select("studio_id").eq("id", user.id).single();
    const profile = profileRaw as { studio_id: string } | null;
    if (!profile?.studio_id) return;
    
    setStudioId(profile.studio_id);

    const now = new Date();
    let start: Date, end: Date;
    if (dateRange === "today") { start = startOfDay(now); end = endOfDay(now); }
    else if (dateRange === "week") { start = startOfDay(subDays(now, 3)); end = endOfDay(addDays(now, 7)); }
    else { start = startOfDay(subDays(now, 0)); end = endOfDay(addDays(now, 30)); }

    const [apptRes, svcRes, cliRes] = await Promise.all([
      supabase.from("appointments").select("*").eq("studio_id", profile.studio_id)
        .gte("appointment_date", start.toISOString())
        .lte("appointment_date", end.toISOString())
        .order("appointment_date"),
      supabase.from("services").select("*").eq("studio_id", profile.studio_id).eq("is_active", true),
      supabase.from("clients").select("*").eq("studio_id", profile.studio_id).eq("is_active", true).order("name"),
    ]);
    setAppts(apptRes.data ?? []);
    setServices(svcRes.data ?? []);
    setClients(cliRes.data ?? []);
    setLoading(false);
  }

  const filtered = useMemo(() => filter === "all" ? appts : appts.filter(a => a.status === filter), [appts, filter]);

  async function saveAppt() {
    if (!studioId || !dateInput || !timeInput) return;
    setSaving(true);
    const svc = services.find(s => s.id === selService);
    const cli = clients.find(c => c.id === selClient);
    const dt  = new Date(`${dateInput}T${timeInput}:00`);
    const { error } = await supabase.from("appointments").insert({
      studio_id: studioId,
      client_id: selClient || null,
      service_id: selService || null,
      client_name: cli?.name ?? clientName,
      service_name: svc?.name ?? "",
      appointment_date: dt.toISOString(),
      duration_minutes: svc?.duration_minutes ?? 30,
      price: svc?.price ?? 0,
      notes: notes || null,
    });
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success("Agendamento criado!");
    setSaving(false); setOpen(false);
    await load();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("appointments").update({ status }).eq("id", id);
    setAppts(a => a.map(x => x.id === id ? { ...x, status } : x));
  }

  async function cancel(id: string) {
    if (!confirm("Cancelar este agendamento?")) return;
    await updateStatus(id, "cancelled");
    toast.success("Agendamento cancelado.");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Agendamentos</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>{filtered.length} agendamentos</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary"><Plus size={16} /> Novo</button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["today","week","month"] as const).map(d => (
          <button key={d} onClick={() => setDateRange(d)} className="btn-ghost"
            style={dateRange === d ? { borderColor: "var(--brand)", color: "var(--brand-light)" } : {}}>
            {d === "today" ? "Hoje" : d === "week" ? "7 dias" : "30 dias"}
          </button>
        ))}
        <div className="w-px" style={{ background: "var(--border)" }} />
        {(["all","pending","confirmed","completed","cancelled"] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} className="btn-ghost text-xs"
            style={filter === s ? { borderColor: "var(--brand)", color: "var(--brand-light)" } : {}}>
            {s === "all" ? "Todos" : STATUS_MAP[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={28} style={{ color: "var(--brand)" }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <CalendarDays size={32} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
          <p style={{ color: "var(--muted)" }}>Nenhum agendamento encontrado.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(appt => {
            const st = STATUS_MAP[appt.status] ?? { label: appt.status, cls: "badge-gray" };
            return (
              <div key={appt.id} className="card flex items-center gap-3">
                <div className="shrink-0 text-center w-12">
                  <p className="text-sm font-black" style={{ color: "var(--brand-light)" }}>
                    {format(new Date(appt.appointment_date), "HH:mm")}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {format(new Date(appt.appointment_date), "dd/MM")}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: "var(--text)" }}>{appt.client_name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{appt.service_name}</p>
                </div>
                <div className="hidden md:flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{formatCurrency(appt.price)}</span>
                </div>
                <span className={`badge ${st.cls} shrink-0`}>{st.label}</span>
                <div className="flex gap-1 shrink-0">
                  {st.next && (
                    <button onClick={() => updateStatus(appt.id, st.next!)} className="btn-ghost text-xs px-2">
                      {STATUS_MAP[st.next!]?.label}
                    </button>
                  )}
                  {!["cancelled","completed"].includes(appt.status) && (
                    <button onClick={() => cancel(appt.id)} className="btn-ghost text-xs px-2" style={{ color: "#f87171" }}>Cancelar</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="card w-full max-w-md">
            <h2 className="text-base font-black mb-4" style={{ color: "var(--text)" }}>Novo Agendamento</h2>
            <div className="flex flex-col gap-3">
              <select className="input-base" value={selService} onChange={e => setSelService(e.target.value)}>
                <option value="">Selecione o serviço</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} — R$ {s.price}</option>)}
              </select>
              <select className="input-base" value={selClient} onChange={e => setSelClient(e.target.value)}>
                <option value="">Selecione a cliente (ou digite abaixo)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {!selClient && <input className="input-base" placeholder="Nome da cliente *" value={clientName} onChange={e => setClientName(e.target.value)} />}
              <div className="grid grid-cols-2 gap-3">
                <input className="input-base" type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} />
                <input className="input-base" type="time" value={timeInput} onChange={e => setTimeInput(e.target.value)} />
              </div>
              <textarea className="input-base h-auto py-3" rows={2} placeholder="Observações" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveAppt} className="btn-primary flex-1" disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : "Confirmar"}
              </button>
              <button onClick={() => setOpen(false)} className="btn-ghost flex-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
