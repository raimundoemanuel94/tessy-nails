"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Sparkles,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const card = "rgba(255,255,255,0.035)";
const card2 = "rgba(255,255,255,0.055)";
const border = "rgba(255,255,255,0.07)";
const purp = "#a78bfa";
const pink = "#f472b6";
const grn = "#34d399";
const amb = "#fbbf24";
const red = "#f87171";
const text = "#f0f0ff";
const muted = "#8f89aa";

type Apt = {
  id: string;
  client_name: string;
  service_name: string;
  appointment_date: string;
  duration_minutes: number;
  price: number;
  status: string;
};

const STATUS: Record<string, { label: string; color: string; icon: any }> = {
  confirmed: { label: "Confirmado", color: grn, icon: CheckCircle2 },
  pending: { label: "Pendente", color: amb, icon: AlertCircle },
  completed: { label: "Concluído", color: purp, icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: red, icon: XCircle },
};

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const fmt = (n: number) => `R$ ${Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtT = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const fmtD = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
const fmtFull = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
const toISO = (d: Date) => d.toISOString().slice(0, 10);
const addD = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

function Sk({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "rgba(255,255,255,0.06)", animation: "shimmer 1.6s ease-in-out infinite" }} />;
}

function KpiCard({ icon: Icon, label, value, sub, color, loading }: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="dash-kpi-card">
      <div className="dash-kpi-icon" style={{ color, background: `${color}18`, borderColor: `${color}30` }}>
        <Icon size={16} />
      </div>
      <span>{label}</span>
      {loading ? (
        <>
          <Sk w={92} h={28} />
          <Sk w={72} h={11} />
        </>
      ) : (
        <>
          <strong>{value}</strong>
          {sub && <small>{sub}</small>}
        </>
      )}
      <i style={{ background: `linear-gradient(90deg, ${color}65, transparent)` }} />
    </div>
  );
}

function QuickAction({ href, icon: Icon, title, sub, color, primary = false }: {
  href: string;
  icon: any;
  title: string;
  sub: string;
  color: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`dash-quick-action ${primary ? "is-primary" : ""}`}
      style={{
        borderColor: `${color}45`,
        background: primary ? `linear-gradient(135deg, ${color}33, rgba(255,255,255,0.04))` : `${color}12`,
      }}
    >
      <span style={{ color, background: `${color}20`, borderColor: `${color}35` }}><Icon size={17} /></span>
      <strong>{title}</strong>
      <small>{sub}</small>
    </Link>
  );
}

export default function DashboardPage() {
  const [apts, setApts] = useState<Apt[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOff, setWeekOff] = useState(0);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = toISO(today);
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const weekStart = (() => {
    const d = new Date(today);
    const dow = d.getDay();
    d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow) + weekOff * 7);
    return d;
  })();
  const weekDays = Array.from({ length: 7 }, (_, i) => addD(weekStart, i));
  const weekEnd = weekDays[6];

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: profile } = await sb.from("profiles").select("studio_id").eq("id", user.id).single();
      if (!profile?.studio_id) { setLoading(false); return; }
      const { data } = await sb
        .from("appointments")
        .select("id, client_name, service_name, appointment_date, duration_minutes, price, status")
        .eq("studio_id", profile.studio_id)
        .order("appointment_date", { ascending: true });
      if (data) setApts(data);
      setLoading(false);
    })();
  }, []);

  const todayApts = apts.filter(a => a.appointment_date.slice(0, 10) === todayStr);
  const weekApts = apts.filter(a => {
    const d = a.appointment_date.slice(0, 10);
    return d >= toISO(weekStart) && d <= toISO(weekEnd);
  });
  const monthApts = apts.filter(a => {
    const d = a.appointment_date.slice(0, 10);
    return d >= monthStart && d <= monthEnd;
  });
  const pendingAll = apts.filter(a => a.status === "pending");
  const nextApt = apts
    .filter(a => a.appointment_date >= now.toISOString() && !["completed", "cancelled"].includes(a.status))
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0];
  const monthRevenue = monthApts.filter(a => a.status === "completed").reduce((sum, a) => sum + (a.price || 0), 0);
  const uniqueMonthClients = new Set(monthApts.map(a => a.client_name)).size;

  const setStatus = async (id: string, status: string) => {
    const { error } = await createClient().from("appointments").update({ status }).eq("id", id);
    if (error) {
      console.error("Erro ao atualizar status:", error.message);
      return;
    }
    setApts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="dash-home">
      <header className="dash-hero">
        <div>
          <h1>{greeting}</h1>
          <p>{now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        {!loading && pendingAll.length > 0 && (
          <div className="dash-pending-pill">
            <i />
            <span>{pendingAll.length} pendente{pendingAll.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </header>

      <section className="dash-quick-grid">
        <QuickAction href="/agenda" icon={CalendarCheck} title="Abrir agenda" sub="ver atendimentos" color={purp} primary />
        <QuickAction href="/disponibilidade" icon={CalendarPlus} title="Liberar vagas" sub="semana e horários" color={grn} />
        <QuickAction href="/vitrine" icon={Sparkles} title="Postar status" sub="gerar vitrine" color={pink} />
      </section>

      <section className="dash-kpi-grid">
        <KpiCard loading={loading} icon={Calendar} color={purp} label="Hoje" value={loading ? "-" : todayApts.length} sub={`${pendingAll.length} pendente${pendingAll.length !== 1 ? "s" : ""}`} />
        <KpiCard loading={loading} icon={DollarSign} color={grn} label="Faturamento mês" value={loading ? "-" : fmt(monthRevenue)} sub="concluídos" />
        <KpiCard loading={loading} icon={Users} color={pink} label="Clientes mês" value={loading ? "-" : uniqueMonthClients} sub={`${monthApts.length} atendimento${monthApts.length !== 1 ? "s" : ""}`} />
        <KpiCard loading={loading} icon={TrendingUp} color={amb} label="Total geral" value={loading ? "-" : apts.length} sub={`${monthApts.length} este mês`} />
      </section>

      {!loading && nextApt && (
        <section className="dash-next-card">
          <div className="dash-next-icon"><CalendarCheck size={22} /></div>
          <div>
            <p>Próximo horário</p>
            <strong>{nextApt.client_name} - {nextApt.service_name}</strong>
            <span>{fmtFull(nextApt.appointment_date)} as {fmtT(nextApt.appointment_date)} - {fmt(nextApt.price || 0)}</span>
          </div>
          <Link href="/agenda">Ver agenda</Link>
        </section>
      )}

      <section className="dash-content-grid">
        <article className="dash-panel">
          <header>
            <div><i style={{ background: purp }} /> <strong>Agenda de hoje</strong></div>
            <span>{loading ? "..." : `${todayApts.length} atend.`}</span>
          </header>
          <div className="dash-list">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="dash-row"><Sk w={58} h={44} /><div><Sk w="70%" h={12} /><Sk w="42%" h={10} /></div></div>)
            ) : todayApts.length === 0 ? (
              <div className="dash-empty"><strong>Dia livre</strong><span>Nenhum agendamento hoje</span></div>
            ) : (
              todayApts.map((a, i) => <AppointmentRow key={a.id} appointment={a} last={i === todayApts.length - 1} onStatus={setStatus} />)
            )}
          </div>
        </article>

        <article className="dash-panel">
          <header>
            <div><i style={{ background: grn }} /> <strong>Semana</strong> <small>{fmtD(weekStart)} - {fmtD(weekEnd)}</small></div>
            <div className="dash-week-nav">
              <button onClick={() => setWeekOff(w => w - 1)}><ChevronLeft size={14} /></button>
              <button onClick={() => setWeekOff(0)}>Hoje</button>
              <button onClick={() => setWeekOff(w => w + 1)}><ChevronRight size={14} /></button>
            </div>
          </header>
          <div className="dash-week-grid">
            {weekDays.map(day => {
              const dayStr = toISO(day);
              const isToday = dayStr === todayStr;
              const dayApts = weekApts
                .filter(a => a.appointment_date.slice(0, 10) === dayStr)
                .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
              return (
                <div key={dayStr} className={isToday ? "is-today" : ""}>
                  <div className="dash-day-head">
                    <span>{DAYS[day.getDay()]}</span>
                    <strong>{day.getDate()}</strong>
                  </div>
                  <div className="dash-day-items">
                    {dayApts.slice(0, 4).map(a => {
                      const st = STATUS[a.status] ?? { color: muted };
                      return (
                        <div key={a.id} style={{ borderLeftColor: st.color, background: `${st.color}13` }}>
                          <strong>{fmtT(a.appointment_date)}</strong>
                          <span style={{ color: st.color }}>{a.client_name}</span>
                        </div>
                      );
                    })}
                    {dayApts.length > 4 && <em>+{dayApts.length - 4}</em>}
                  </div>
                </div>
              );
            })}
          </div>
          {weekApts.length > 0 && (
            <footer className="dash-week-legend">
              {(["confirmed", "pending", "completed", "cancelled"] as const).map(status => {
                const count = weekApts.filter(a => a.status === status).length;
                if (!count) return null;
                const st = STATUS[status];
                return <span key={status}><i style={{ background: st.color }} />{st.label} <b style={{ color: st.color }}>{count}</b></span>;
              })}
              <strong>{weekApts.length} na semana</strong>
            </footer>
          )}
        </article>
      </section>

      {!loading && pendingAll.length > 0 && (
        <section className="dash-panel dash-pending-panel">
          <header>
            <div><i style={{ background: amb }} /> <strong>Confirmacoes pendentes</strong></div>
            <span>{pendingAll.length}</span>
          </header>
          <div className="dash-list">
            {pendingAll.map((a, i) => <AppointmentRow key={a.id} appointment={a} last={i === pendingAll.length - 1} onStatus={setStatus} pending />)}
          </div>
        </section>
      )}

      <style>{`
        @keyframes shimmer { 0%,100%{opacity:.3} 50%{opacity:.7} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
        .dash-home { display:flex; flex-direction:column; gap:20px; max-width:1400px; }
        .dash-hero { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .dash-hero h1 { margin:0; font-size:26px; font-weight:900; color:${text}; background:linear-gradient(120deg,${text},${purp}); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .dash-hero p { margin:4px 0 0; color:${muted}; font-size:13px; }
        .dash-pending-pill { display:flex; align-items:center; gap:8px; background:${amb}12; border:1px solid ${amb}30; border-radius:12px; padding:10px 14px; color:${amb}; font-size:13px; font-weight:800; }
        .dash-pending-pill i { width:7px; height:7px; border-radius:50%; background:${amb}; animation:blink 1.4s ease-in-out infinite; }
        .dash-quick-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
        .dash-quick-action { min-height:74px; border:1px solid; border-radius:16px; padding:12px; text-decoration:none; display:grid; grid-template-columns:auto 1fr; gap:4px 10px; align-items:center; }
        .dash-quick-action span { width:34px; height:34px; border-radius:11px; border:1px solid; display:grid; place-items:center; grid-row:1 / span 2; }
        .dash-quick-action strong { color:${text}; font-size:13px; line-height:1.1; grid-column:2; align-self:end; }
        .dash-quick-action small { color:${muted}; font-size:11px; line-height:1.1; grid-column:2; align-self:start; }
        .dash-kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        .dash-kpi-card { position:relative; overflow:hidden; background:linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.02)); border:1px solid ${border}; border-radius:18px; padding:20px; min-height:150px; display:flex; flex-direction:column; gap:8px; }
        .dash-kpi-card > span { color:${muted}; font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .dash-kpi-card strong { color:${text}; font-size:29px; font-weight:900; line-height:1; }
        .dash-kpi-card small { color:${muted}; font-size:12px; }
        .dash-kpi-card > i { position:absolute; left:0; right:0; bottom:0; height:2px; }
        .dash-kpi-icon { position:absolute; right:18px; top:18px; width:36px; height:36px; border-radius:10px; border:1px solid; display:grid; place-items:center; }
        .dash-next-card { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:14px; align-items:center; padding:16px; border-radius:18px; background:linear-gradient(135deg, ${grn}14, rgba(167,139,250,.06)); border:1px solid ${grn}30; }
        .dash-next-icon { width:52px; height:52px; border-radius:16px; display:grid; place-items:center; color:${grn}; background:${grn}16; border:1px solid ${grn}36; }
        .dash-next-card p { margin:0 0 4px; color:${grn}; font-size:11px; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }
        .dash-next-card strong { display:block; color:${text}; font-size:16px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dash-next-card span { display:block; color:${muted}; font-size:12px; margin-top:4px; }
        .dash-next-card a { height:38px; padding:0 14px; border-radius:11px; border:1px solid ${grn}35; background:${grn}14; color:${grn}; display:inline-flex; align-items:center; justify-content:center; text-decoration:none; font-size:12px; font-weight:900; }
        .dash-content-grid { display:grid; grid-template-columns:1fr 1.6fr; gap:18px; align-items:start; }
        .dash-panel { background:${card}; border:1px solid ${border}; border-radius:18px; overflow:hidden; backdrop-filter:blur(10px); }
        .dash-panel > header { padding:17px 18px; border-bottom:1px solid ${border}; display:flex; align-items:center; justify-content:space-between; gap:12px; background:linear-gradient(135deg, rgba(167,139,250,.08), rgba(244,114,182,.035)); }
        .dash-panel header div { display:flex; align-items:center; gap:9px; min-width:0; }
        .dash-panel header i { width:8px; height:8px; border-radius:50%; box-shadow:0 0 8px currentColor; }
        .dash-panel header strong { color:${text}; font-size:14px; font-weight:850; }
        .dash-panel header small, .dash-panel header span { color:${muted}; font-size:11px; }
        .dash-list { padding:4px 0; }
        .dash-row { display:flex; flex-wrap:wrap; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid ${border}; }
        .dash-time { width:58px; padding:8px 4px; border-radius:10px; text-align:center; flex-shrink:0; }
        .dash-time strong { display:block; font-size:15px; line-height:1; }
        .dash-time span { display:block; color:${muted}; font-size:9px; margin-top:3px; }
        .dash-info { flex:1; min-width:120px; }
        .dash-info strong { display:block; color:${text}; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .dash-info span { display:flex; align-items:center; gap:5px; color:${muted}; font-size:11px; margin-top:3px; flex-wrap:wrap; }
        .dash-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .dash-actions > span { color:${grn}; font-size:14px; font-weight:900; }
        .dash-actions button { border-radius:9px; padding:7px 12px; font-size:11px; cursor:pointer; font-weight:800; font-family:inherit; white-space:nowrap; }
        .dash-empty { text-align:center; padding:44px 20px; color:${muted}; display:grid; gap:5px; }
        .dash-empty strong { color:${text}; }
        .dash-week-nav { display:flex; gap:6px; }
        .dash-week-nav button { background:${card2}; border:1px solid ${border}; border-radius:9px; color:${muted}; padding:7px 10px; font-size:11px; font-weight:800; cursor:pointer; font-family:inherit; display:flex; align-items:center; }
        .dash-week-grid { padding:12px 14px; display:grid; grid-template-columns:repeat(7,minmax(40px,1fr)); gap:5px; overflow-x:auto; }
        .dash-week-grid > div { min-width:42px; }
        .dash-day-head { display:flex; flex-direction:column; align-items:center; padding:8px 4px 6px; border-radius:12px; margin-bottom:5px; border:1px solid transparent; }
        .dash-week-grid .is-today .dash-day-head { background:linear-gradient(135deg,${purp}30,${pink}20); border-color:${purp}50; }
        .dash-day-head span { color:${muted}; font-size:9px; font-weight:900; text-transform:uppercase; }
        .dash-day-head strong { color:${text}; font-size:20px; line-height:1.2; }
        .dash-week-grid .is-today .dash-day-head strong, .dash-week-grid .is-today .dash-day-head span { color:${purp}; }
        .dash-day-items { display:flex; flex-direction:column; gap:3px; min-height:90px; }
        .dash-day-items div { border-left:2px solid; border-radius:0 5px 5px 0; padding:3px 5px; overflow:hidden; }
        .dash-day-items strong, .dash-day-items span { display:block; font-size:9px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dash-day-items strong { color:${text}; }
        .dash-day-items em { color:${muted}; font-size:9px; text-align:center; font-style:normal; font-weight:800; }
        .dash-week-legend { padding:12px 16px; border-top:1px solid ${border}; display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
        .dash-week-legend span { color:${muted}; font-size:10px; display:flex; align-items:center; gap:5px; }
        .dash-week-legend i { width:6px; height:6px; border-radius:50%; }
        .dash-week-legend strong { margin-left:auto; color:${muted}; font-size:11px; }
        @media (max-width: 768px) {
          .dash-home { gap:14px; }
          .dash-hero { align-items:flex-start; }
          .dash-hero h1 { font-size:22px; }
          .dash-hero p { font-size:12px; }
          .dash-pending-pill { padding:8px 10px; font-size:11px; }
          .dash-quick-grid { grid-template-columns:1fr; gap:9px; }
          .dash-quick-action { min-height:58px; border-radius:14px; padding:10px 12px; grid-template-columns:auto 1fr auto; }
          .dash-quick-action::after {
            content:"›";
            color:rgba(255,255,255,.55);
            font-size:22px;
            font-weight:900;
            grid-column:3;
            grid-row:1 / span 2;
            align-self:center;
          }
          .dash-quick-action span { width:32px; height:32px; grid-row:1 / span 2; }
          .dash-kpi-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
          .dash-kpi-card { min-height:108px; padding:14px; border-radius:15px; }
          .dash-kpi-icon { right:12px; top:12px; width:31px; height:31px; }
          .dash-kpi-card > span { font-size:9px; padding-right:35px; }
          .dash-kpi-card strong { font-size:23px; }
          .dash-kpi-card small { font-size:10.5px; }
          .dash-next-card { grid-template-columns:auto minmax(0,1fr); padding:14px; }
          .dash-next-card a { grid-column:1 / -1; width:100%; }
          .dash-content-grid { grid-template-columns:1fr; gap:14px; }
          .dash-panel > header { padding:15px; }
          .dash-row { padding:13px 15px; }
          .dash-actions { width:100%; justify-content:space-between; padding-left:68px; }
          .dash-actions button { min-height:36px; padding:0 14px; }
          .dash-week-grid { padding:10px 12px; grid-template-columns:repeat(7,minmax(42px,1fr)); }
        }
      `}</style>
    </div>
  );
}

function AppointmentRow({ appointment, last, onStatus, pending = false }: {
  appointment: Apt;
  last: boolean;
  onStatus: (id: string, status: string) => void;
  pending?: boolean;
}) {
  const st = STATUS[appointment.status] ?? { label: appointment.status, color: muted, icon: Clock };
  const Icon = st.icon;
  return (
    <div className="dash-row" style={{ borderBottom: last ? "none" : undefined }}>
      <div className="dash-time" style={{ background: `${st.color}12`, border: `1px solid ${st.color}25` }}>
        <strong style={{ color: st.color }}>{fmtT(appointment.appointment_date)}</strong>
        <span>{appointment.duration_minutes}min</span>
      </div>
      <div className="dash-info">
        <strong>{appointment.client_name}</strong>
        <span>
          <Icon size={11} color={st.color} />
          <b style={{ color: st.color }}>{st.label}</b>
          <em style={{ fontStyle: "normal" }}>· {appointment.service_name}</em>
        </span>
      </div>
      <div className="dash-actions">
        <span>{fmt(appointment.price || 0)}</span>
        {appointment.status === "pending" && (
          <button onClick={() => onStatus(appointment.id, "confirmed")} style={{ background: `${grn}18`, border: `1px solid ${grn}35`, color: grn }}>
            Confirmar
          </button>
        )}
        {appointment.status === "confirmed" && (
          <button onClick={() => onStatus(appointment.id, "completed")} style={{ background: `${purp}18`, border: `1px solid ${purp}35`, color: purp }}>
            Concluir
          </button>
        )}
        {pending && (
          <button onClick={() => onStatus(appointment.id, "cancelled")} style={{ background: `${red}10`, border: `1px solid ${red}25`, color: red }}>
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
