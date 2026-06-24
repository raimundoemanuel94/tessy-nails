"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, Search, XCircle } from "lucide-react";
import { AdminMetricCard, AdminStatusBadge } from "@/components/admin/AdminUI";
import { formatCurrency } from "@/lib/utils";

const STATUS: Record<string, { label: string; tone: "success"|"warning"|"danger"|"muted" }> = {
  completed: { label: "Concluído",  tone: "success" },
  confirmed: { label: "Confirmado", tone: "success" },
  pending:   { label: "Pendente",   tone: "warning" },
  cancelled: { label: "Cancelado",  tone: "danger"  },
  canceled:  { label: "Cancelado",  tone: "danger"  },
};

const C = { card: "#ffffff", border: "#e2e8f0", sep: "#f0f0f8", text: "#0f172a", sub: "#64748b", muted: "#94a3b8" };

const PERIODS = [
  { key: "today",  label: "Hoje"    },
  { key: "7d",     label: "7 dias"  },
  { key: "30d",    label: "30 dias" },
  { key: "all",    label: "Todos"   },
];

function startOf(key: string): Date | null {
  const now = new Date();
  if (key === "today") { const d = new Date(now); d.setHours(0,0,0,0); return d; }
  if (key === "7d")    { const d = new Date(now); d.setDate(d.getDate()-7); return d; }
  if (key === "30d")   { const d = new Date(now); d.setDate(d.getDate()-30); return d; }
  return null;
}

export default function AdminAgendamentosPage() {
  const sb = createClient();
  const [appts,   setAppts]   = useState<any[]>([]);
  const [studios, setStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [period,  setPeriod]  = useState("7d");
  const [studioFilter, setStudioFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      sb.from("appointments").select("id,studio_id,client_name,service_name,appointment_date,duration_minutes,price,status,payment_status,created_at").order("appointment_date", { ascending: false }).limit(500),
      sb.from("studios").select("id,name,slug"),
    ]).then(([a, s]) => {
      setAppts(a.data ?? []);
      setStudios(s.data ?? []);
      setLoading(false);
    });
  }, []);

  const studioById = useMemo(() => new Map(studios.map(s => [s.id, s])), [studios]);

  const filtered = useMemo(() => {
    const start = startOf(period);
    return appts.filter(a => {
      if (start && new Date(a.appointment_date) < start) return false;
      if (studioFilter !== "all" && a.studio_id !== studioFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const studio = studioById.get(a.studio_id);
        return (a.client_name??"").toLowerCase().includes(q)
          || (a.service_name??"").toLowerCase().includes(q)
          || (studio?.name??"").toLowerCase().includes(q);
      }
      return true;
    });
  }, [appts, period, studioFilter, statusFilter, search, studioById]);

  const today     = filtered.filter(a => { const d = new Date(a.appointment_date); const n = new Date(); return d.toDateString()===n.toDateString(); });
  const upcoming  = filtered.filter(a => new Date(a.appointment_date) >= new Date());
  const completed = filtered.filter(a => a.status === "completed");
  const cancelled = filtered.filter(a => ["cancelled","canceled"].includes(a.status));
  const revenue   = completed.reduce((s,a) => s + Number(a.price??0), 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22, maxWidth:1180 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:600, color:"#7c3aed", textTransform:"uppercase", letterSpacing:".08em", marginBottom:4 }}>Operação</p>
          <h1 style={{ fontSize:24, fontWeight:800, color:C.text, margin:0, letterSpacing:"-.03em" }}>Agendamentos globais</h1>
          <p style={{ fontSize:13, color:C.sub, marginTop:4 }}>Monitoramento de todos os salões</p>
        </div>
        {/* Filtros de período */}
        <div style={{ display:"flex", gap:6 }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", border:"none",
                background: period===p.key ? "#7c3aed" : "#f1f5f9",
                color: period===p.key ? "#fff" : C.sub }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <AdminMetricCard label="Hoje"       value={today.length}     sub="atendimentos no dia"        icon={CalendarDays} tone="brand"   />
        <AdminMetricCard label="Próximos"   value={upcoming.length}  sub="a partir de agora"          icon={Clock}        tone="warning" />
        <AdminMetricCard label="Concluídos" value={completed.length} sub={formatCurrency(revenue)}    icon={CheckCircle2} tone="success" />
        <AdminMetricCard label="Cancelados" value={cancelled.length} sub={`${filtered.length} no período`} icon={XCircle} tone={cancelled.length?"danger":"muted"} />
      </div>

      {/* Filtros */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        {/* Busca */}
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:C.muted }} />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cliente, serviço, salão..."
            style={{ width:"100%", height:36, paddingLeft:33, paddingRight:12, borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, outline:"none", fontFamily:"inherit", background:"#fff", color:C.text, boxSizing:"border-box" }} />
        </div>
        {/* Filtro salão */}
        <select value={studioFilter} onChange={e=>setStudioFilter(e.target.value)}
          style={{ height:36, padding:"0 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, background:"#fff", color:C.text, fontFamily:"inherit", cursor:"pointer" }}>
          <option value="all">Todos os salões</option>
          {studios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {/* Filtro status */}
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
          style={{ height:36, padding:"0 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, background:"#fff", color:C.text, fontFamily:"inherit", cursor:"pointer" }}>
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="confirmed">Confirmado</option>
          <option value="completed">Concluído</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {/* Tabela */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1.1fr 1fr 1fr .8fr .8fr .7fr", gap:12, padding:"10px 16px", background:"#f8fafc", borderBottom:`1px solid ${C.sep}` }}>
          {["Cliente","Salão","Serviço","Data","Status","Valor"].map(h => (
            <span key={h} style={{ color:C.muted, fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding:"32px 0", textAlign:"center", color:C.muted, fontSize:13 }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:"48px 24px", textAlign:"center" }}>
            <CalendarDays size={24} style={{ opacity:.3, marginBottom:10, color:C.muted }} />
            <p style={{ fontSize:14, fontWeight:600, color:C.sub }}>Nenhum agendamento no período</p>
            <p style={{ fontSize:12, color:C.muted }}>Tente mudar o filtro de período ou salão</p>
          </div>
        ) : filtered.slice(0,100).map((a,i) => {
          const studio = studioById.get(a.studio_id);
          const st = STATUS[a.status] ?? { label: a.status||"—", tone:"muted" };
          return (
            <div key={a.id} style={{ display:"grid", gridTemplateColumns:"1.1fr 1fr 1fr .8fr .8fr .7fr", gap:12, alignItems:"center", padding:"13px 16px", borderBottom: i<filtered.length-1 ? `1px solid ${C.sep}` : "none" }}
              onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")}
              onMouseLeave={e=>(e.currentTarget.style.background="")}>
              <strong style={{ color:C.text, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.client_name}</strong>
              <div style={{ minWidth:0 }}>
                {studio ? (
                  <Link href={`/admin/studios/${studio.id}`} style={{ color:"#7c3aed", fontSize:12, fontWeight:600, textDecoration:"none" }}>{studio.name}</Link>
                ) : <span style={{ color:C.muted, fontSize:12 }}>—</span>}
              </div>
              <span style={{ color:C.sub, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.service_name||"Serviço"}</span>
              <span style={{ color:C.sub, fontSize:12 }}>{new Date(a.appointment_date).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span>
              <AdminStatusBadge tone={st.tone} dot>{st.label}</AdminStatusBadge>
              <strong style={{ color:Number(a.price)>0?"#10b981":C.muted, fontSize:13 }}>{formatCurrency(Number(a.price??0))}</strong>
            </div>
          );
        })}
        {filtered.length > 100 && (
          <div style={{ padding:"12px 16px", textAlign:"center", color:C.muted, fontSize:12, borderTop:`1px solid ${C.sep}` }}>
            Mostrando 100 de {filtered.length} resultados. Use os filtros para refinar.
          </div>
        )}
      </div>
    </div>
  );
}
