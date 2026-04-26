"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  differenceInCalendarDays,
  differenceInDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  getHours,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import {
  BarChart3, TrendingUp, Scissors,
  Download, Target, Search, UsersRound,
  UserX, Clock, Zap,
  ArrowUpRight, ArrowDownRight, Minus, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/shared/PageShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RevenueChart, ServicesDonut } from "@/components/dashboard/DashboardCharts";
import { appointmentService } from "@/services/appointments";
import { clientService } from "@/services/clients";
import { Appointment, Client, Service } from "@/types";
import { globalStore } from "@/store/globalStore";
import {
  getLast30DaysInterval,
  getPrevious30DaysInterval,
} from "@/lib/analytics-period";
import { ensureDate, cn } from "@/lib/utils";

// tipos locais
type PeriodKey = "hoje" | "semana" | "mes" | "last30days";
type Interval = { start: Date; end: Date };
type ServiceMixItem = { name: string; value: number };
type MonthRevenueItem = { date: string; total: number };
type ClientDateMode = "last_visit" | "created_at";
type ClientStatusFilter = "todos" | "ativos" | "inativos";
type ClientReportRow = {
  client: Client;
  appointments: Appointment[];
  completedAppointments: Appointment[];
  totalAppointments: number;
  completedCount: number;
  totalSpent: number;
  lastAppointmentDate: Date | null;
  lastCompletedDate: Date | null;
  lastServiceName: string;
  recentServices: string[];
  avgDaysBetweenVisits: number | null;
};

// helpers
const FILTERS: PeriodKey[] = ["hoje", "semana", "mes", "last30days"];
const PERIOD_LABELS: Record<PeriodKey, string> = {
  hoje: "Hoje",
  semana: "Semana",
  mes: "Mes",
  last30days: "30 dias",
};
const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function getPeriodInterval(period: PeriodKey, base: Date): Interval {
  if (period === "hoje") return { start: startOfDay(base), end: endOfDay(base) };
  if (period === "semana") return { start: startOfWeek(base, { weekStartsOn: 1 }), end: endOfWeek(base, { weekStartsOn: 1 }) };
  if (period === "mes") return { start: startOfMonth(base), end: endOfMonth(base) };
  return getLast30DaysInterval(base);
}

function getPreviousInterval(period: PeriodKey, base: Date): Interval {
  if (period === "hoje") {
    const previousDay = subDays(base, 1);
    return { start: startOfDay(previousDay), end: endOfDay(previousDay) };
  }
  if (period === "semana") {
    const previousWeekBase = subDays(startOfWeek(base, { weekStartsOn: 1 }), 1);
    return {
      start: startOfWeek(previousWeekBase, { weekStartsOn: 1 }),
      end: endOfWeek(previousWeekBase, { weekStartsOn: 1 }),
    };
  }
  if (period === "mes") {
    const previousMonth = subMonths(base, 1);
    return { start: startOfMonth(previousMonth), end: endOfMonth(previousMonth) };
  }
  return getPrevious30DaysInterval(base);
}

function getGrowth(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return Number((((curr - prev) / prev) * 100).toFixed(1));
}

function toCurrency(v: number) {
  return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toCsvCell(v: string | number) { return '"' + String(v).replace(/"/g, '""')+'"'; }

function parseInputDate(value: string, eod = false): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const p = new Date(y, m - 1, d);
  if (Number.isNaN(p.getTime())) return null;
  return eod ? endOfDay(p) : startOfDay(p);
}

// KpiCard
function KpiCard({ label, value, sub, trend, color = "neutral" }: {
  label: string; value: string | number; sub?: string;
  trend?: { value: number; isPositive: boolean } | null; color?: "neutral" | "brand" | "success" | "warning" | "danger";
}) {
  const valueColor = {
    neutral: "text-brand-text-main",
    brand: "text-brand-primary",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };
  return (
    <div className="rounded-2xl border border-brand-accent/10 bg-white p-4 sm:p-5 flex flex-col gap-1 transition-all hover:shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest leading-none text-brand-text-sub opacity-70">{label}</p>
      <p className={cn("text-2xl font-black leading-tight", valueColor[color])}>{value}</p>
      {sub && <p className="text-[11px] font-bold text-brand-text-sub opacity-60 leading-none">{sub}</p>}
      {trend !== undefined && trend !== null && (
        <div className={cn("flex items-center gap-1 mt-1 text-[11px] font-black", trend.isPositive ? "text-emerald-600" : "text-red-500")}>
          {trend.value === 0 ? <Minus size={12} /> : trend.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend.value === 0 ? "Estavel" : Math.abs(trend.value) + "% vs anterior"}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, desc, actions }: { icon?: React.ElementType; title: string; desc?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        {Icon && <div className="h-9 w-9 rounded-xl bg-brand-primary/10 flex items-center justify-center"><Icon size={18} className="text-brand-primary" /></div>}
        <div>
          <h3 className="text-base font-black text-brand-text-main tracking-tight">{title}</h3>
          {desc && <p className="text-[11px] font-bold text-brand-text-sub opacity-60">{desc}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

// pagina principal
export default function RelatoriosPage() {
  const now = useMemo(() => new Date(), []);

  const [loading, setLoading]           = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices]         = useState<Service[]>([]);
  const [clients, setClients]           = useState<Client[]>([]);
  const [activeFilter, setActiveFilter] = useState<PeriodKey>("mes");
  const [clientSearch, setClientSearch] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState<ClientStatusFilter>("todos");
  const [clientServiceFilter, setClientServiceFilter] = useState("todos");
  const [clientDateMode, setClientDateMode] = useState<ClientDateMode>("last_visit");
  const [clientStartDate, setClientStartDate] = useState("");
  const [clientEndDate, setClientEndDate]     = useState("");
  const [showAllServices, setShowAllServices] = useState(false);
  const [clientFiltersOpen, setClientFiltersOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const [appts, svcs, cls] = await Promise.all([
          appointmentService.getAll(),
          globalStore.fetchServices(false),
          clientService.getAll(),
        ]);
        await Promise.resolve();
        setAppointments(appts);
        setServices(svcs);
        setClients(cls);
      } catch (err) {
        console.error(err);
        toast.error("Nao foi possivel carregar os dados dos relatorios.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // mapas base
  const serviceById = useMemo(
    () => new Map(services.map((s) => [s.id, { name: s.name, price: Number(s.price) || 0 }])),
    [services]
  );

  const completedAll = useMemo(() => appointments.filter((a) => a.status === "completed"),  [appointments]);
  const pendingAll   = useMemo(() => appointments.filter((a) => a.status === "pending" || a.status === "confirmed"), [appointments]);
  const cancelledAll = useMemo(() => appointments.filter((a) => a.status === "cancelled"),  [appointments]);
  const noShowAll    = useMemo(() => appointments.filter((a) => a.status === "no_show"),    [appointments]);

  // intervalos
  const activeInterval = useMemo(() => getPeriodInterval(activeFilter, now), [activeFilter, now]);
  const prevInterval   = useMemo(() => getPreviousInterval(activeFilter, now), [activeFilter, now]);

  const filterBy = useCallback((data: Appointment[], iv: Interval) =>
    data.filter((a) => isWithinInterval(ensureDate(a.appointmentDate), iv)), []);

  const sumRev = useCallback((data: Appointment[]) =>
    data.reduce((t, a) => t + (serviceById.get(a.serviceId)?.price ?? 0), 0), [serviceById]);

  // periodo selecionado
  const periodAppts     = useMemo(() => filterBy(appointments,  activeInterval), [appointments,  activeInterval, filterBy]);
  const periodCompleted = useMemo(() => filterBy(completedAll,  activeInterval), [completedAll,  activeInterval, filterBy]);
  const periodOpen      = useMemo(() => filterBy(pendingAll,    activeInterval), [pendingAll,    activeInterval, filterBy]);
  const periodCancelled = useMemo(() => filterBy(cancelledAll,  activeInterval), [cancelledAll,  activeInterval, filterBy]);
  const periodNoShow    = useMemo(() => filterBy(noShowAll,     activeInterval), [noShowAll,     activeInterval, filterBy]);
  const prevCompleted   = useMemo(() => filterBy(completedAll,  prevInterval),   [completedAll,  prevInterval,   filterBy]);

  const periodRev = useMemo(() => sumRev(periodCompleted), [periodCompleted, sumRev]);
  const prevRev   = useMemo(() => sumRev(prevCompleted),   [prevCompleted,   sumRev]);
  const revenueGrowth = useMemo(() => getGrowth(periodRev, prevRev), [periodRev, prevRev]);

  const periodTicket = useMemo(
    () => periodCompleted.length > 0 ? periodRev / periodCompleted.length : 0,
    [periodCompleted, periodRev]
  );
  const periodUniqueClients = useMemo(
    () => new Set(periodAppts.map((a) => a.clientId).filter(Boolean)).size,
    [periodAppts]
  );
  const prevUniqueClients = useMemo(
    () => new Set(filterBy(appointments, prevInterval).map((a) => a.clientId).filter(Boolean)).size,
    [appointments, prevInterval, filterBy]
  );
  const clientsGrowth = useMemo(() => getGrowth(periodUniqueClients, prevUniqueClients), [periodUniqueClients, prevUniqueClients]);

  const cancellationRate = useMemo(
    () => periodAppts.length > 0 ? Number(((periodCancelled.length / periodAppts.length) * 100).toFixed(1)) : 0,
    [periodAppts, periodCancelled]
  );
  const noShowRate = useMemo(
    () => periodAppts.length > 0 ? Number(((periodNoShow.length / periodAppts.length) * 100).toFixed(1)) : 0,
    [periodAppts, periodNoShow]
  );

  // clientes inativos 60+ dias
  const inactiveClients = useMemo(() => {
    const threshold = subDays(now, 60);
    return clients.filter((c) => {
      const clientAppts = completedAll.filter((a) => a.clientId === c.id);
      if (clientAppts.length === 0) return false;
      const lastDate = clientAppts
        .map((a) => ensureDate(a.appointmentDate))
        .sort((a, b) => b.getTime() - a.getTime())[0];
      return lastDate < threshold;
    });
  }, [clients, completedAll, now]);

  // taxa de retorno
  const returnRateData = useMemo(() => {
    let returned = 0, eligible = 0;
    const clientMap = new Map<string, Date[]>();
    periodCompleted.forEach((a) => {
      const dates = clientMap.get(a.clientId) ?? [];
      dates.push(ensureDate(a.appointmentDate));
      clientMap.set(a.clientId, dates);
    });
    clientMap.forEach((dates) => {
      if (dates.length < 2) return;
      const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
      for (let i = 1; i < sorted.length; i++) {
        eligible++;
        if (differenceInDays(sorted[i], sorted[i - 1]) <= 45) returned++;
      }
    });
    return eligible > 0 ? Number(((returned / eligible) * 100).toFixed(1)) : 0;
  }, [periodCompleted]);

  // intervalo medio
  const avgReturnDays = useMemo(() => {
    const gaps: number[] = [];
    const clientMap = new Map<string, Date[]>();
    periodCompleted.forEach((a) => {
      const dates = clientMap.get(a.clientId) ?? [];
      dates.push(ensureDate(a.appointmentDate));
      clientMap.set(a.clientId, dates);
    });
    clientMap.forEach((dates) => {
      if (dates.length < 2) return;
      const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
      for (let i = 1; i < sorted.length; i++) {
        gaps.push(differenceInDays(sorted[i], sorted[i - 1]));
      }
    });
    return gaps.length > 0 ? Math.round(gaps.reduce((t, v) => t + v, 0) / gaps.length) : 0;
  }, [periodCompleted]);

  // pico por dia da semana
  const peakByDow = useMemo(() => {
    const counts = Array(7).fill(0) as number[];
    periodAppts.forEach((a) => { counts[getDay(ensureDate(a.appointmentDate))]++; });
    return counts;
  }, [periodAppts]);

  const peakDowMax = useMemo(() => Math.max(...peakByDow, 1), [peakByDow]);

  // pico por hora
  const peakByHour = useMemo(() => {
    const counts: Record<number, number> = {};
    periodAppts.forEach((a) => {
      const h = getHours(ensureDate(a.appointmentDate));
      counts[h] = (counts[h] ?? 0) + 1;
    });
    return counts;
  }, [periodAppts]);

  const topHour = useMemo(() => {
    const entries = Object.entries(peakByHour);
    if (entries.length === 0) return null;
    const [h, c] = entries.sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    return { hour: h + "h-" + (Number(h) + 1) + "h", count: c };
  }, [peakByHour]);

  // sinal pendente
  const pendingPayment = useMemo(
    () => periodOpen.filter((a) => a.paymentStatus !== "fully_paid"),
    [periodOpen]
  );

  // ranking de servicos
  const serviceRanking = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number; cancelled: number; noShow: number }>();
    const process = (list: Appointment[], key: "count" | "cancelled" | "noShow") => {
      list.forEach((a) => {
        const svc = serviceById.get(a.serviceId);
        if (!svc) return;
        const cur = map.get(a.serviceId) ?? { name: svc.name, count: 0, revenue: 0, cancelled: 0, noShow: 0 };
        if (key === "count") { cur.count++; cur.revenue += svc.price; }
        if (key === "cancelled") cur.cancelled++;
        if (key === "noShow") cur.noShow++;
        map.set(a.serviceId, cur);
      });
    };
    process(periodCompleted, "count");
    process(periodCancelled, "cancelled");
    process(periodNoShow, "noShow");
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map((s) => ({
        ...s,
        ticket: s.count > 0 ? s.revenue / s.count : 0,
        cancelRate: s.count + s.cancelled > 0 ? Number(((s.cancelled / (s.count + s.cancelled)) * 100).toFixed(1)) : 0,
      }));
  }, [periodCompleted, periodCancelled, periodNoShow, serviceById]);

  // grafico evolucao
  const chartRevenueData = useMemo<MonthRevenueItem[]>(() => {
    const revenueByDay = new Map<string, number>();
    periodCompleted.forEach((appointment) => {
      const dayKey = format(ensureDate(appointment.appointmentDate), "yyyy-MM-dd");
      const currentRevenue = revenueByDay.get(dayKey) ?? 0;
      const nextRevenue = currentRevenue + (serviceById.get(appointment.serviceId)?.price ?? 0);
      revenueByDay.set(dayKey, nextRevenue);
    });
    const daysInInterval = differenceInCalendarDays(activeInterval.end, activeInterval.start) + 1;
    return Array.from({ length: Math.max(daysInInterval, 1) }, (_, index) => {
      const day = addDays(activeInterval.start, index);
      const dayKey = format(day, "yyyy-MM-dd");
      return {
        date: format(day, "dd/MM"),
        total: revenueByDay.get(dayKey) ?? 0,
      };
    });
  }, [periodCompleted, serviceById, activeInterval]);

  const serviceDistribution = useMemo<ServiceMixItem[]>(() => {
    const counts = new Map<string, number>();
    periodCompleted.forEach((a) => {
      const name = serviceById.get(a.serviceId)?.name ?? "Removido";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    const total = Array.from(counts.values()).reduce((t, v) => t + v, 0);
    if (total === 0) return [];
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, value: Number(((count / total) * 100).toFixed(1)) }));
  }, [periodCompleted, serviceById]);

  // tabela clientes 360
  const clientReportRows = useMemo<ClientReportRow[]>(() => {
    const apptsByClient = new Map<string, Appointment[]>();
    appointments.forEach((a) => {
      const cur = apptsByClient.get(a.clientId) ?? [];
      cur.push(a);
      apptsByClient.set(a.clientId, cur);
    });
    return clients
      .map((c) => {
        const all = [...(apptsByClient.get(c.id) ?? [])].sort(
          (a, b) => ensureDate(b.appointmentDate).getTime() - ensureDate(a.appointmentDate).getTime()
        );
        const done = all.filter((a) => a.status === "completed");
        const dates = done.map((a) => ensureDate(a.appointmentDate)).sort((a, b) => a.getTime() - b.getTime());
        let avgGap: number | null = null;
        if (dates.length >= 2) {
          const gaps = dates.slice(1).map((d, i) => differenceInDays(d, dates[i]));
          avgGap = Math.round(gaps.reduce((t, v) => t + v, 0) / gaps.length);
        }
        return {
          client: c,
          appointments: all,
          completedAppointments: done,
          totalAppointments: all.length,
          completedCount: done.length,
          totalSpent: done.reduce((t, a) => t + (serviceById.get(a.serviceId)?.price ?? 0), 0),
          lastAppointmentDate: all[0] ? ensureDate(all[0].appointmentDate) : null,
          lastCompletedDate: done[0] ? ensureDate(done[0].appointmentDate) : null,
          lastServiceName: done[0] ? (serviceById.get(done[0].serviceId)?.name ?? "-") : "-",
          recentServices: done.slice(0, 3).map((a) => serviceById.get(a.serviceId)?.name ?? "-"),
          avgDaysBetweenVisits: avgGap,
        };
      })
      .sort((a, b) => {
        const ad = a.lastCompletedDate ?? a.lastAppointmentDate ?? ensureDate(a.client.createdAt);
        const bd = b.lastCompletedDate ?? b.lastAppointmentDate ?? ensureDate(b.client.createdAt);
        return bd.getTime() - ad.getTime();
      });
  }, [appointments, clients, serviceById]);

  const clientDateStart = useMemo(() => parseInputDate(clientStartDate, false), [clientStartDate]);
  const clientDateEnd   = useMemo(() => parseInputDate(clientEndDate, true),    [clientEndDate]);

  const filteredClientRows = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    return clientReportRows.filter((row) => {
      if (clientStatusFilter === "ativos"   && row.client.isActive === false) return false;
      if (clientStatusFilter === "inativos" && row.client.isActive !== false) return false;
      if (clientServiceFilter !== "todos" && !row.appointments.some((a) => a.serviceId === clientServiceFilter)) return false;
      if (q && ![row.client.name, row.client.email ?? "", row.client.phone ?? ""].some((f) => f.toLowerCase().includes(q))) return false;
      if (clientDateStart || clientDateEnd) {
        const ref = clientDateMode === "created_at" ? ensureDate(row.client.createdAt) : row.lastCompletedDate ?? row.lastAppointmentDate;
        if (!ref) return false;
        if (clientDateStart && ref < clientDateStart) return false;
        if (clientDateEnd   && ref > clientDateEnd)   return false;
      }
      return true;
    });
  }, [clientReportRows, clientSearch, clientStatusFilter, clientServiceFilter, clientDateMode, clientDateStart, clientDateEnd]);

  const filteredRev       = useMemo(() => filteredClientRows.reduce((t, r) => t + r.totalSpent, 0),       [filteredClientRows]);
  const filteredDone      = useMemo(() => filteredClientRows.reduce((t, r) => t + r.completedCount, 0),   [filteredClientRows]);
  const filteredWithVisit = useMemo(() => filteredClientRows.filter((r) => r.totalAppointments > 0).length,[filteredClientRows]);
  const filteredTicket    = useMemo(() => filteredDone > 0 ? filteredRev / filteredDone : 0,               [filteredRev, filteredDone]);

  // exportacao premium
  const exportPremium = () => {
    try {
      const now2 = new Date();
      const rows: string[] = [];
      const pr = (...cols: Array<string | number>) => rows.push(cols.map(toCsvCell).join(";"));
      pr("RELATORIO PREMIUM - TESSY NAILS");
      pr("Gerado em", format(now2, "dd/MM/yyyy HH:mm"));
      pr("Periodo", PERIOD_LABELS[activeFilter]);
      rows.push("");
      pr("RESUMO EXECUTIVO");
      pr("Receita", toCurrency(periodRev));
      pr("Crescimento", revenueGrowth + "%");
      pr("Ticket medio", toCurrency(periodTicket));
      pr("Clientes unicos", periodUniqueClients);
      pr("Concluidos", periodCompleted.length);
      pr("Em aberto", periodOpen.length);
      pr("Agendamentos", periodAppts.length);
      pr("Cancelamentos", periodCancelled.length, cancellationRate + "%");
      pr("Nao compareceu", periodNoShow.length, noShowRate + "%");
      pr("Taxa de retorno 45d", returnRateData + "%");
      pr("Intervalo medio visitas", avgReturnDays + " dias");
      rows.push("");
      pr("RANKING DE SERVICOS");
      pr("Servico", "Concluidos", "Receita", "Ticket medio", "Taxa de cancelamento");
      serviceRanking.forEach((s) => pr(s.name, s.count, toCurrency(s.revenue), toCurrency(s.ticket), s.cancelRate + "%"));
      rows.push("");
      pr("CLIENTES INATIVOS 60+ DIAS");
      pr("Cliente", "Telefone", "Ultimo atendimento");
      inactiveClients.forEach((c) => {
        const last = completedAll.filter((a) => a.clientId === c.id).sort((a, b) => ensureDate(b.appointmentDate).getTime() - ensureDate(a.appointmentDate).getTime())[0];
        pr(c.name, c.phone ?? "-", last ? format(ensureDate(last.appointmentDate), "dd/MM/yyyy") : "-");
      });
      const csv = "\uFEFF" + rows.join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      a.download = "relatorio-premium-" + activeFilter + "-" + format(now2, "yyyy-MM-dd-HH-mm") + ".csv";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success("Relatorio exportado com sucesso.");
    } catch (err) { console.error(err); toast.error("Nao foi possivel exportar."); }
  };

  const exportClients = () => {
    try {
      const now2 = new Date();
      const rows: string[] = [];
      const pr = (...cols: Array<string | number>) => rows.push(cols.map(toCsvCell).join(";"));
      pr("RELATORIO CLIENTES 360 - TESSY NAILS");
      pr("Gerado em", format(now2, "dd/MM/yyyy HH:mm"));
      rows.push("");
      pr("Cliente", "Telefone", "Email", "Status", "Cadastro", "Ultimo atendimento", "Ultimo servico", "Historico recente", "Concluidos", "Total", "Receita", "Intervalo medio");
      filteredClientRows.forEach((r) => pr(
        r.client.name, r.client.phone ?? "-", r.client.email ?? "-",
        r.client.isActive !== false ? "Ativo" : "Inativo",
        format(ensureDate(r.client.createdAt), "dd/MM/yyyy"),
        r.lastCompletedDate ? format(r.lastCompletedDate, "dd/MM/yyyy") : "-",
        r.lastServiceName,
        r.recentServices.join(" | ") || "-",
        r.completedCount, r.totalAppointments, toCurrency(r.totalSpent),
        r.avgDaysBetweenVisits ? r.avgDaysBetweenVisits + " dias" : "-"
      ));
      const csv = "\uFEFF" + rows.join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      a.download = "clientes-360-" + format(now2, "yyyy-MM-dd-HH-mm") + ".csv";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success("Relatorio de clientes exportado.");
    } catch (err) { console.error(err); toast.error("Nao foi possivel exportar."); }
  };

  // loading skeleton
  if (loading) {
    return (
      <PageShell>
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-16 rounded-2xl bg-brand-soft/40" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map((i) => <div key={i} className="h-28 rounded-2xl bg-brand-soft/40" />)}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => <div key={i} className="h-24 rounded-2xl bg-brand-soft/40" />)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 h-72 rounded-2xl bg-brand-soft/40" />
            <div className="h-72 rounded-2xl bg-brand-soft/40" />
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Relatorios"
        description="Dados reais do Firestore em tempo real."
        icon={BarChart3}
      >
        <Button onClick={exportPremium} size="sm"
          className="rounded-xl font-bold gap-2 bg-brand-primary hover:opacity-90 text-white shadow-md">
          <Download size={14} /> Exportar Premium
        </Button>
      </PageHeader>

      {/* Filtro de periodo */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-2xl border border-brand-accent/10 bg-white p-1.5 shadow-sm">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={cn(
              "h-9 rounded-xl px-3 text-[10px] font-black uppercase tracking-wider transition-all",
              activeFilter === f
                ? "bg-brand-primary text-white shadow-md"
                : "text-brand-text-sub hover:text-brand-primary hover:bg-brand-primary/5"
            )}>
            {PERIOD_LABELS[f]}
          </button>
        ))}
        <div className="ml-auto pr-2 text-[10px] font-bold text-brand-text-sub opacity-50">
          {format(activeInterval.start, "dd/MM")} &rarr; {format(activeInterval.end, "dd/MM")}
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label={"Receita - " + PERIOD_LABELS[activeFilter]}
          value={toCurrency(periodRev)}
          sub={"Anterior: " + toCurrency(prevRev)}
          trend={{ value: Math.abs(revenueGrowth), isPositive: revenueGrowth >= 0 }}
          color="brand"
        />
        <KpiCard
          label="Clientes unicos"
          value={periodUniqueClients}
          sub={"Ticket medio: " + toCurrency(periodTicket)}
          trend={{ value: Math.abs(clientsGrowth), isPositive: clientsGrowth >= 0 }}
          color="neutral"
        />
        <KpiCard
          label={"Agendamentos - " + PERIOD_LABELS[activeFilter]}
          value={periodAppts.length}
          sub={`${periodCompleted.length} concluidos`}
          color="neutral"
        />
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <div className="rounded-xl border border-emerald-200 bg-white p-4">
          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Concluidos</p>
          <p className="text-xl font-black text-emerald-600">{periodCompleted.length}</p>
          <p className="text-[10px] text-brand-text-sub opacity-50">{periodOpen.length} em aberto</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-white p-4">
          <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Cancelamentos</p>
          <p className="text-xl font-black text-red-600">{periodCancelled.length}</p>
          <p className="text-[10px] text-red-400 font-bold">taxa {cancellationRate}%</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white p-4">
          <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Nao compareceu</p>
          <p className="text-xl font-black text-amber-600">{periodNoShow.length}</p>
          <p className="text-[10px] text-amber-400 font-bold">taxa {noShowRate}%</p>
        </div>
        <div className="rounded-xl border border-brand-accent/10 bg-white p-4">
          <p className="text-[9px] font-black text-brand-text-sub uppercase tracking-widest mb-1">Taxa de Retorno</p>
          <p className="text-xl font-black text-brand-text-main">{returnRateData}%</p>
          <p className="text-[10px] text-brand-text-sub opacity-50">em ate 45 dias</p>
        </div>
        <div className="rounded-xl border border-brand-accent/10 bg-white p-4">
          <p className="text-[9px] font-black text-brand-text-sub uppercase tracking-widest mb-1">Intervalo Medio</p>
          <p className="text-xl font-black text-brand-text-main">{avgReturnDays || "-"}</p>
          <p className="text-[10px] text-brand-text-sub opacity-50">dias entre visitas</p>
        </div>
        <div className={cn("rounded-xl border p-4", pendingPayment.length > 0 ? "border-orange-200 bg-orange-50" : "border-brand-accent/10 bg-white")}>
          <p className={cn("text-[9px] font-black uppercase tracking-widest mb-1", pendingPayment.length > 0 ? "text-orange-500" : "text-brand-text-sub")}>Sinal Pendente</p>
          <p className={cn("text-xl font-black", pendingPayment.length > 0 ? "text-orange-600" : "text-brand-text-main")}>{pendingPayment.length}</p>
          <p className={cn("text-[10px] font-bold", pendingPayment.length > 0 ? "text-orange-400" : "text-brand-text-sub opacity-50")}>agend. sem pagamento</p>
        </div>
      </div>

      {/* Graficos */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2 bg-white border border-brand-accent/10 rounded-2xl p-6 shadow-sm">
          <SectionTitle icon={TrendingUp} title="Evolucao Financeira" desc={"Faturamento concluido - " + PERIOD_LABELS[activeFilter]} />
          {chartRevenueData.some((d) => d.total > 0) ? (
            <div className="h-[280px]"><RevenueChart data={chartRevenueData} /></div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center gap-3 text-brand-text-sub opacity-40">
              <BarChart3 size={40} strokeWidth={1} />
              <p className="text-sm font-bold">Nenhum atendimento concluido ainda</p>
            </div>
          )}
        </div>
        <div className="bg-white border border-brand-accent/10 rounded-2xl p-6 shadow-sm">
          <SectionTitle icon={Target} title="Mix de Servicos" desc="Participacao no periodo" />
          {serviceDistribution.length > 0 ? (
            <div className="h-[240px]"><ServicesDonut data={serviceDistribution} /></div>
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center gap-3 text-brand-text-sub opacity-40">
              <Target size={36} strokeWidth={1} />
              <p className="text-sm font-bold">Sem dados no periodo</p>
            </div>
          )}
        </div>
      </div>

      {/* Pico por dia da semana */}
      <div className="bg-white border border-brand-accent/10 rounded-2xl p-6 shadow-sm mb-8">
        <SectionTitle icon={Clock} title="Horarios de Pico" desc={"Agendamentos por dia da semana - " + PERIOD_LABELS[activeFilter]} />
        <div className="flex items-end gap-3 h-20">
          {DAY_NAMES.map((day, i) => {
            const count = peakByDow[i] ?? 0;
            const pct = peakDowMax > 0 ? (count / peakDowMax) * 100 : 0;
            const isTop = count === peakDowMax && count > 0;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: "56px" }}>
                  <div
                    className={cn("w-full rounded-t-lg transition-all", isTop ? "bg-brand-primary" : "bg-brand-primary/20")}
                    style={{ height: Math.max(pct, count > 0 ? 8 : 0) + "%" }}
                  />
                </div>
                <span className={cn("text-[9px] font-black uppercase", isTop ? "text-brand-primary" : "text-brand-text-sub opacity-50")}>{day}</span>
                {count > 0 && <span className="text-[8px] font-bold text-brand-text-sub opacity-40">{count}</span>}
              </div>
            );
          })}
          {topHour && (
            <div className="ml-4 pl-4 border-l border-brand-accent/10 flex flex-col justify-center gap-1 shrink-0">
              <p className="text-[9px] font-black text-brand-text-sub uppercase tracking-widest">Pico de hora</p>
              <p className="text-lg font-black text-brand-primary">{topHour.hour}</p>
              <p className="text-[10px] font-bold text-brand-text-sub opacity-60">{topHour.count} agend.</p>
            </div>
          )}
        </div>
      </div>

      {/* Ranking de servicos */}
      <div className="bg-white border border-brand-accent/10 rounded-2xl p-6 shadow-sm mb-8">
        <SectionTitle icon={Scissors} title="Ranking de Servicos" desc={"Performance detalhada - " + PERIOD_LABELS[activeFilter]} />
        {serviceRanking.length === 0 ? (
          <p className="text-sm font-bold text-brand-text-sub opacity-40 text-center py-8">Sem atendimentos no periodo.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-brand-accent/10">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-brand-text-sub">#</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-brand-text-sub">Servico</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-brand-text-sub text-right">Concluidos</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-brand-text-sub text-right">Receita</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-brand-text-sub text-right">Ticket Medio</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-brand-text-sub text-right">Cancelamentos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(showAllServices ? serviceRanking : serviceRanking.slice(0, 5)).map((s, i) => (
                  <TableRow key={s.name} className="border-brand-accent/5 hover:bg-brand-background/50">
                    <TableCell className="text-[11px] font-black text-brand-text-sub w-8">{i + 1}</TableCell>
                    <TableCell className="text-sm font-bold text-brand-text-main">{s.name}</TableCell>
                    <TableCell className="text-sm font-black text-brand-text-main text-right">{s.count}</TableCell>
                    <TableCell className="text-sm font-bold text-brand-text-main text-right">{toCurrency(s.revenue)}</TableCell>
                    <TableCell className="text-sm font-bold text-brand-text-sub text-right">{toCurrency(s.ticket)}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("text-[11px] font-black px-2 py-0.5 rounded-full",
                        s.cancelRate > 20 ? "bg-red-100 text-red-600" :
                        s.cancelRate > 10 ? "bg-amber-100 text-amber-600" :
                        "bg-emerald-100 text-emerald-600"
                      )}>
                        {s.cancelRate}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {serviceRanking.length > 5 && (
              <button onClick={() => setShowAllServices((v) => !v)}
                className="mt-3 w-full flex items-center justify-center gap-1 text-[11px] font-bold text-brand-primary hover:underline">
                {showAllServices ? <><ChevronUp size={12} /> Ver menos</> : <><ChevronDown size={12} /> Ver todos ({serviceRanking.length})</>}
              </button>
            )}
          </>
        )}
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className={cn("rounded-2xl border p-5", inactiveClients.length > 0 ? "border-amber-200 bg-amber-50" : "border-brand-accent/10 bg-white")}>
          <SectionTitle icon={UserX} title="Clientes Inativos" desc="Sem visita ha 60+ dias" />
          {inactiveClients.length === 0 ? (
            <p className="text-sm font-bold text-emerald-600">Nenhum cliente inativo - otimo!</p>
          ) : (
            <div className="space-y-2">
              {inactiveClients.slice(0, 4).map((c) => {
                const last = completedAll
                  .filter((a) => a.clientId === c.id)
                  .sort((a, b) => ensureDate(b.appointmentDate).getTime() - ensureDate(a.appointmentDate).getTime())[0];
                const dias = last ? differenceInDays(now, ensureDate(last.appointmentDate)) : null;
                return (
                  <div key={c.id} className="flex items-center justify-between">
                    <p className="text-sm font-bold text-brand-text-main">{c.name}</p>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      {dias ? dias + "d atras" : "-"}
                    </span>
                  </div>
                );
              })}
              {inactiveClients.length > 4 && (
                <p className="text-[11px] font-bold text-amber-500">+{inactiveClients.length - 4} clientes inativos</p>
              )}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-brand-accent/10 bg-white p-5">
          <SectionTitle icon={Zap} title="Resumo de Saude" desc="Indicadores do negocio" />
          <div className="space-y-3">
            {[
              { label: "Taxa de conclusao", value: (periodAppts.length > 0 ? ((periodCompleted.length / periodAppts.length) * 100).toFixed(0) : 0) + "%", ok: (periodCompleted.length / Math.max(periodAppts.length, 1)) > 0.7 },
              { label: "Clientes retornando", value: returnRateData + "%", ok: returnRateData >= 60 },
              { label: "Taxa de cancelamento", value: cancellationRate + "%", ok: cancellationRate <= 10 },
              { label: "Clientes inativos", value: String(inactiveClients.length), ok: inactiveClients.length === 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <p className="text-sm font-bold text-brand-text-sub">{item.label}</p>
                <span className={cn("text-sm font-black", item.ok ? "text-emerald-600" : "text-amber-600")}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clientes 360 */}
      <div className="bg-white border border-brand-accent/10 rounded-2xl p-6 shadow-sm mb-8">
        <SectionTitle
          icon={UsersRound}
          title="Clientes 360"
          desc="Historico completo com filtros avancados"
          actions={
            <>
              <Button variant="outline" size="sm" className="rounded-xl font-bold text-[11px]"
                onClick={() => { setClientSearch(""); setClientStatusFilter("todos"); setClientServiceFilter("todos"); setClientDateMode("last_visit"); setClientStartDate(""); setClientEndDate(""); }}>
                Limpar
              </Button>
              <Button size="sm" className="rounded-xl font-bold text-[11px] gap-1.5 bg-brand-primary text-white hover:opacity-90"
                onClick={exportClients}>
                <Download size={12} /> Exportar
              </Button>
            </>
          }
        />

        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-sub opacity-40" size={16} />
            <Input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Nome, telefone ou e-mail"
              className="pl-9 h-10 rounded-xl bg-brand-background/50 text-sm" />
          </div>
          <Button variant="outline" size="sm"
            onClick={() => setClientFiltersOpen(!clientFiltersOpen)}
            className={cn(
              "h-10 px-3 rounded-xl border font-bold text-[11px] gap-1.5 transition-colors",
              clientFiltersOpen ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-brand-accent/20 text-brand-text-sub"
            )}>
            Filtros {clientFiltersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </Button>
        </div>
        {clientFiltersOpen && (
          <div className="space-y-3 mb-4 p-3 rounded-2xl border border-brand-accent/10 bg-brand-background/30">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              {[
                { val: clientStatusFilter, set: setClientStatusFilter as (v: string) => void, opts: [["todos","Todos"],["ativos","Ativos"],["inativos","Inativos"]] },
                { val: clientServiceFilter, set: setClientServiceFilter as (v: string) => void, opts: [["todos","Todos os servicos"], ...services.slice().sort((a,b)=>a.name.localeCompare(b.name)).map((s)=>[s.id, s.name])] },
                { val: clientDateMode, set: setClientDateMode as (v: string) => void, opts: [["last_visit","Ultimo atendimento"],["created_at","Data de cadastro"]] },
              ].map((sel, i) => (
                <select key={i} value={sel.val}
                  onChange={(e) => sel.set(e.target.value)}
                  className="h-10 w-full rounded-xl border border-brand-accent/15 bg-white/60 px-3 text-sm font-bold text-brand-text-main outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10">
                  {sel.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
            </div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              <Input type="date" value={clientStartDate} onChange={(e) => setClientStartDate(e.target.value)} className="h-10 rounded-xl text-sm" />
              <Input type="date" value={clientEndDate}   onChange={(e) => setClientEndDate(e.target.value)}   className="h-10 rounded-xl text-sm" />
              {[
                { label: "Filtrados", value: filteredClientRows.length },
                { label: "Receita estimada", value: toCurrency(filteredRev) },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-brand-background/50 border border-brand-accent/10 px-4 py-2 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-brand-text-sub uppercase tracking-widest">{m.label}</p>
                  <p className="text-sm font-black text-brand-text-main">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Com visita",    value: filteredWithVisit },
            { label: "Concluidos",   value: filteredDone },
            { label: "Receita total", value: toCurrency(filteredRev) },
            { label: "Ticket medio",  value: toCurrency(filteredTicket) },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-brand-accent/10 bg-brand-background/30 p-3">
              <p className="text-[9px] font-black text-brand-text-sub uppercase tracking-widest mb-1">{m.label}</p>
              <p className="text-base font-black text-brand-text-main">{m.value}</p>
            </div>
          ))}
        </div>

        {filteredClientRows.length === 0 ? (
          <p className="text-sm font-bold text-brand-text-sub opacity-40 text-center py-10">Nenhum cliente encontrado.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-brand-accent/10">
            <Table>
              <TableHeader>
                <TableRow className="border-brand-accent/10 bg-brand-background/30">
                  {["Cliente","Ultimo atendimento","Ultimo servico","Concluidos","Receita","Intervalo medio","Status"].map((h) => (
                    <TableHead key={h} className="text-[9px] font-black uppercase tracking-widest text-brand-text-sub whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientRows.map((r) => {
                  const diasSemVisita = r.lastCompletedDate ? differenceInDays(now, r.lastCompletedDate) : null;
                  const inativo = diasSemVisita !== null && diasSemVisita > 60;
                  return (
                    <TableRow key={r.client.id} className="border-brand-accent/5 hover:bg-brand-background/40">
                      <TableCell>
                        <div>
                          <p className="text-sm font-bold text-brand-text-main leading-tight">{r.client.name}</p>
                          <p className="text-[10px] font-bold text-brand-text-sub opacity-50">{r.client.phone ?? r.client.email ?? "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-bold text-brand-text-sub whitespace-nowrap">
                        {r.lastCompletedDate ? format(r.lastCompletedDate, "dd/MM/yyyy") : "-"}
                        {diasSemVisita !== null && <span className={cn("ml-1 text-[10px] font-black", inativo ? "text-amber-500" : "text-brand-text-sub opacity-40")}>{diasSemVisita}d</span>}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-brand-text-main max-w-[140px] truncate">{r.lastServiceName}</TableCell>
                      <TableCell className="text-sm font-black text-brand-text-main text-center">{r.completedCount}</TableCell>
                      <TableCell className="text-sm font-bold text-brand-text-main whitespace-nowrap">{toCurrency(r.totalSpent)}</TableCell>
                      <TableCell className="text-sm font-bold text-brand-text-sub text-center">
                        {r.avgDaysBetweenVisits ? r.avgDaysBetweenVisits + "d" : "-"}
                      </TableCell>
                      <TableCell>
                        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full",
                          inativo ? "bg-amber-100 text-amber-600" :
                          r.client.isActive !== false ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"
                        )}>
                          {inativo ? "Inativo" : r.client.isActive !== false ? "Ativo" : "Desativado"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <footer className="flex items-center justify-center gap-2 pb-8 opacity-20">
        <Scissors size={10} className="text-brand-primary" />
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary">Tessy Nails - Relatorios</span>
      </footer>
    </PageShell>
  );
}
