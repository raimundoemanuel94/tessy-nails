"use client";

import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, subDays, subMonths, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart3,
  TrendingUp,
  Users,
  Scissors,
  DollarSign,
  Download,
  Target,
  Activity,
  Search,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/shared/PageShell";
import { PageHero } from "@/components/shared/PageHero";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RevenueChart, ServicesDonut } from "@/components/dashboard/DashboardCharts";
import { appointmentService } from "@/services/appointments";
import { clientService } from "@/services/clients";
import { Appointment, Client, Service } from "@/types";
import { globalStore } from "@/store/globalStore";
import { ensureDate, cn } from "@/lib/utils";

type PeriodKey = "hoje" | "semana" | "mes" | "periodo";
type Interval = { start: Date; end: Date };
type ServiceMixItem = { name: string; value: number };
type MonthRevenueItem = { date: string; Revenue: number };
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
};

const FILTERS: PeriodKey[] = ["hoje", "semana", "mes", "periodo"];

function getPeriodInterval(period: PeriodKey, baseDate: Date): Interval {
  if (period === "hoje") {
    return { start: startOfDay(baseDate), end: endOfDay(baseDate) };
  }

  if (period === "semana") {
    return {
      start: startOfWeek(baseDate, { weekStartsOn: 1 }),
      end: endOfWeek(baseDate, { weekStartsOn: 1 }),
    };
  }

  if (period === "mes") {
    return { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
  }

  return {
    start: startOfMonth(subMonths(baseDate, 5)),
    end: endOfDay(baseDate),
  };
}

function getPreviousInterval(period: PeriodKey, baseDate: Date): Interval {
  if (period === "hoje") {
    const previousDay = subDays(baseDate, 1);
    return { start: startOfDay(previousDay), end: endOfDay(previousDay) };
  }

  if (period === "semana") {
    const previousWeekBase = subDays(startOfWeek(baseDate, { weekStartsOn: 1 }), 1);
    return {
      start: startOfWeek(previousWeekBase, { weekStartsOn: 1 }),
      end: endOfWeek(previousWeekBase, { weekStartsOn: 1 }),
    };
  }

  if (period === "mes") {
    const previousMonth = subMonths(baseDate, 1);
    return { start: startOfMonth(previousMonth), end: endOfMonth(previousMonth) };
  }

  return {
    start: startOfMonth(subMonths(baseDate, 11)),
    end: endOfMonth(subMonths(baseDate, 6)),
  };
}

function getGrowth(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function toCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toCsvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function statusLabel(status: Appointment["status"]): string {
  if (status === "completed") return "Concluido";
  if (status === "confirmed") return "Confirmado";
  if (status === "pending") return "Pendente";
  if (status === "cancelled") return "Cancelado";
  if (status === "no_show") return "Nao compareceu";
  return status;
}

function parseInputDate(value: string, endOfSelectedDay = false): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;
  return endOfSelectedDay ? endOfDay(parsed) : startOfDay(parsed);
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeFilter, setActiveFilter] = useState<PeriodKey>("mes");
  const [clientSearch, setClientSearch] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState<ClientStatusFilter>("todos");
  const [clientServiceFilter, setClientServiceFilter] = useState("todos");
  const [clientDateMode, setClientDateMode] = useState<ClientDateMode>("last_visit");
  const [clientStartDate, setClientStartDate] = useState("");
  const [clientEndDate, setClientEndDate] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [appointmentsData, servicesData, clientsData] = await Promise.all([
          appointmentService.getAll(),
          globalStore.fetchServices(false),
          clientService.getAll(),
        ]);

        setAppointments(appointmentsData);
        setServices(servicesData);
        setClients(clientsData);
      } catch (error) {
        console.error("Erro ao carregar relatorios:", error);
        toast.error("Nao foi possivel carregar os dados reais dos relatorios.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const now = new Date();

  const serviceById = useMemo(
    () =>
      new Map(
        services.map((service) => [
          service.id,
          { name: service.name, price: Number(service.price) || 0 },
        ])
      ),
    [services]
  );

  const completedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "completed"),
    [appointments]
  );

  const openAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "pending" || appointment.status === "confirmed"),
    [appointments]
  );

  const dayInterval = useMemo(() => getPeriodInterval("hoje", now), [now]);
  const weekInterval = useMemo(() => getPeriodInterval("semana", now), [now]);
  const monthInterval = useMemo(() => getPeriodInterval("mes", now), [now]);
  const activeInterval = useMemo(() => getPeriodInterval(activeFilter, now), [activeFilter, now]);
  const previousActiveInterval = useMemo(() => getPreviousInterval(activeFilter, now), [activeFilter, now]);

  const filterByInterval = (data: Appointment[], interval: Interval): Appointment[] =>
    data.filter((appointment) => {
      const appointmentDate = ensureDate(appointment.appointmentDate);
      return isWithinInterval(appointmentDate, interval);
    });

  const sumRevenue = (data: Appointment[]): number =>
    data.reduce((total, appointment) => total + (serviceById.get(appointment.serviceId)?.price ?? 0), 0);

  const dailyRevenue = useMemo(
    () => sumRevenue(filterByInterval(completedAppointments, dayInterval)),
    [completedAppointments, dayInterval, serviceById]
  );

  const weeklyRevenue = useMemo(
    () => sumRevenue(filterByInterval(completedAppointments, weekInterval)),
    [completedAppointments, weekInterval, serviceById]
  );

  const monthlyRevenue = useMemo(
    () => sumRevenue(filterByInterval(completedAppointments, monthInterval)),
    [completedAppointments, monthInterval, serviceById]
  );

  const periodAppointments = useMemo(
    () => filterByInterval(appointments, activeInterval),
    [appointments, activeInterval]
  );

  const periodCompletedAppointments = useMemo(
    () => filterByInterval(completedAppointments, activeInterval),
    [completedAppointments, activeInterval]
  );

  const periodOpenAppointments = useMemo(
    () => filterByInterval(openAppointments, activeInterval),
    [openAppointments, activeInterval]
  );

  const periodCancelledAppointments = useMemo(
    () => periodAppointments.filter((appointment) => appointment.status === "cancelled"),
    [periodAppointments]
  );

  const periodNoShowAppointments = useMemo(
    () => periodAppointments.filter((appointment) => appointment.status === "no_show"),
    [periodAppointments]
  );

  const periodRevenue = useMemo(
    () => sumRevenue(periodCompletedAppointments),
    [periodCompletedAppointments, serviceById]
  );

  const previousPeriodRevenue = useMemo(
    () => sumRevenue(filterByInterval(completedAppointments, previousActiveInterval)),
    [completedAppointments, previousActiveInterval, serviceById]
  );

  const activeGrowth = useMemo(
    () => getGrowth(periodRevenue, previousPeriodRevenue),
    [periodRevenue, previousPeriodRevenue]
  );

  const periodUniqueClients = useMemo(
    () => new Set(periodAppointments.map((appointment) => appointment.clientId).filter(Boolean)).size,
    [periodAppointments]
  );

  const periodAverageTicket = useMemo(
    () => (periodCompletedAppointments.length > 0 ? periodRevenue / periodCompletedAppointments.length : 0),
    [periodCompletedAppointments.length, periodRevenue]
  );

  const weekGrowth = useMemo(() => {
    const currentWeek = sumRevenue(filterByInterval(completedAppointments, weekInterval));
    const previousWeek = sumRevenue(filterByInterval(completedAppointments, getPreviousInterval("semana", now)));
    return getGrowth(currentWeek, previousWeek);
  }, [completedAppointments, weekInterval, serviceById, now]);

  const dayGrowth = useMemo(() => {
    const currentDay = sumRevenue(filterByInterval(completedAppointments, dayInterval));
    const previousDay = sumRevenue(filterByInterval(completedAppointments, getPreviousInterval("hoje", now)));
    return getGrowth(currentDay, previousDay);
  }, [completedAppointments, dayInterval, serviceById, now]);

  const chartRevenueData = useMemo<MonthRevenueItem[]>(() => {
    const data: MonthRevenueItem[] = [];

    for (let index = 5; index >= 0; index -= 1) {
      const monthDate = subMonths(now, index);
      const monthRevenue = sumRevenue(
        filterByInterval(completedAppointments, {
          start: startOfMonth(monthDate),
          end: endOfMonth(monthDate),
        })
      );

      data.push({
        date: format(monthDate, "MMM", { locale: ptBR }),
        Revenue: monthRevenue,
      });
    }

    return data;
  }, [completedAppointments, now, serviceById]);

  const serviceDistribution = useMemo<ServiceMixItem[]>(() => {
    const counts = new Map<string, number>();

    periodCompletedAppointments.forEach((appointment) => {
      const serviceName = serviceById.get(appointment.serviceId)?.name ?? "Servico removido";
      counts.set(serviceName, (counts.get(serviceName) ?? 0) + 1);
    });

    const total = Array.from(counts.values()).reduce((acc, value) => acc + value, 0);
    if (total === 0) return [];

    return Array.from(counts.entries())
      .sort((first, second) => second[1] - first[1])
      .map(([name, count]) => ({
        name,
        value: Number(((count / total) * 100).toFixed(1)),
      }));
  }, [periodCompletedAppointments, serviceById]);

  const topService = useMemo(() => {
    if (serviceDistribution.length === 0) return { name: "Sem dados", value: 0 };
    return serviceDistribution[0];
  }, [serviceDistribution]);

  const bestWeekDay = useMemo(() => {
    const dayCount = new Map<string, number>();

    periodAppointments.forEach((appointment) => {
      const label = format(ensureDate(appointment.appointmentDate), "EEEE", { locale: ptBR });
      dayCount.set(label, (dayCount.get(label) ?? 0) + 1);
    });

    if (dayCount.size === 0) return { day: "Sem dados", count: 0 };

    const sorted = Array.from(dayCount.entries()).sort((first, second) => second[1] - first[1]);
    return { day: sorted[0][0], count: sorted[0][1] };
  }, [periodAppointments]);

  const clientReportRows = useMemo<ClientReportRow[]>(() => {
    const appointmentsByClient = new Map<string, Appointment[]>();

    appointments.forEach((appointment) => {
      const current = appointmentsByClient.get(appointment.clientId) ?? [];
      current.push(appointment);
      appointmentsByClient.set(appointment.clientId, current);
    });

    const rows = clients.map((client) => {
      const clientAppointments = [...(appointmentsByClient.get(client.id) ?? [])].sort(
        (first, second) =>
          ensureDate(second.appointmentDate).getTime() - ensureDate(first.appointmentDate).getTime()
      );
      const completedAppointments = clientAppointments.filter(
        (appointment) => appointment.status === "completed"
      );

      const lastAppointmentDate =
        clientAppointments.length > 0 ? ensureDate(clientAppointments[0].appointmentDate) : null;
      const lastCompletedDate =
        completedAppointments.length > 0
          ? ensureDate(completedAppointments[0].appointmentDate)
          : client.lastVisit
            ? ensureDate(client.lastVisit)
            : null;

      const lastAppointmentForService =
        completedAppointments[0] ?? clientAppointments[0] ?? null;

      const recentServices = completedAppointments.slice(0, 3).map((appointment) => {
        const service = serviceById.get(appointment.serviceId);
        return service?.name ?? "Servico removido";
      });

      const totalSpent = completedAppointments.reduce(
        (total, appointment) => total + (serviceById.get(appointment.serviceId)?.price ?? 0),
        0
      );

      return {
        client,
        appointments: clientAppointments,
        completedAppointments,
        totalAppointments: clientAppointments.length,
        completedCount: completedAppointments.length,
        totalSpent,
        lastAppointmentDate,
        lastCompletedDate,
        lastServiceName: lastAppointmentForService
          ? serviceById.get(lastAppointmentForService.serviceId)?.name ?? "Servico removido"
          : "Sem atendimento",
        recentServices,
      };
    });

    return rows.sort((first, second) => {
      const firstDate = first.lastCompletedDate ?? first.lastAppointmentDate ?? ensureDate(first.client.createdAt);
      const secondDate = second.lastCompletedDate ?? second.lastAppointmentDate ?? ensureDate(second.client.createdAt);
      return secondDate.getTime() - firstDate.getTime();
    });
  }, [appointments, clients, serviceById]);

  const clientDateStartBoundary = useMemo(
    () => parseInputDate(clientStartDate, false),
    [clientStartDate]
  );
  const clientDateEndBoundary = useMemo(
    () => parseInputDate(clientEndDate, true),
    [clientEndDate]
  );

  const filteredClientRows = useMemo(() => {
    const normalizedSearch = clientSearch.trim().toLowerCase();

    return clientReportRows.filter((row) => {
      if (clientStatusFilter === "ativos" && row.client.isActive === false) return false;
      if (clientStatusFilter === "inativos" && row.client.isActive !== false) return false;

      if (clientServiceFilter !== "todos") {
        const hasService = row.appointments.some(
          (appointment) => appointment.serviceId === clientServiceFilter
        );
        if (!hasService) return false;
      }

      if (normalizedSearch) {
        const matchesSearch =
          row.client.name.toLowerCase().includes(normalizedSearch) ||
          String(row.client.email ?? "").toLowerCase().includes(normalizedSearch) ||
          String(row.client.phone ?? "").toLowerCase().includes(normalizedSearch);
        if (!matchesSearch) return false;
      }

      if (clientDateStartBoundary || clientDateEndBoundary) {
        const referenceDate =
          clientDateMode === "created_at"
            ? ensureDate(row.client.createdAt)
            : row.lastCompletedDate ?? row.lastAppointmentDate;

        if (!referenceDate) return false;
        if (clientDateStartBoundary && referenceDate.getTime() < clientDateStartBoundary.getTime()) {
          return false;
        }
        if (clientDateEndBoundary && referenceDate.getTime() > clientDateEndBoundary.getTime()) {
          return false;
        }
      }

      return true;
    });
  }, [
    clientDateEndBoundary,
    clientDateMode,
    clientDateStartBoundary,
    clientReportRows,
    clientSearch,
    clientServiceFilter,
    clientStatusFilter,
  ]);

  const filteredClientRevenue = useMemo(
    () => filteredClientRows.reduce((total, row) => total + row.totalSpent, 0),
    [filteredClientRows]
  );

  const filteredClientCompleted = useMemo(
    () => filteredClientRows.reduce((total, row) => total + row.completedCount, 0),
    [filteredClientRows]
  );

  const filteredClientsWithVisits = useMemo(
    () => filteredClientRows.filter((row) => row.totalAppointments > 0).length,
    [filteredClientRows]
  );

  const filteredClientAverageTicket = useMemo(
    () => (filteredClientCompleted > 0 ? filteredClientRevenue / filteredClientCompleted : 0),
    [filteredClientCompleted, filteredClientRevenue]
  );

  const periodLabel = useMemo(() => {
    if (activeFilter === "hoje") return "Hoje";
    if (activeFilter === "semana") return "Semana";
    if (activeFilter === "mes") return "Mes";
    return "Ultimos 6 meses";
  }, [activeFilter]);

  const exportPremiumReport = () => {
    try {
      const generatedAt = new Date();
      const detailedRows = [...periodAppointments].sort(
        (first, second) => ensureDate(first.appointmentDate).getTime() - ensureDate(second.appointmentDate).getTime()
      );

      const serviceRankingRaw = new Map<string, { count: number; revenue: number }>();

      periodCompletedAppointments.forEach((appointment) => {
        const service = serviceById.get(appointment.serviceId);
        const serviceName = service?.name ?? "Servico removido";
        const current = serviceRankingRaw.get(serviceName) ?? { count: 0, revenue: 0 };
        serviceRankingRaw.set(serviceName, {
          count: current.count + 1,
          revenue: current.revenue + (service?.price ?? 0),
        });
      });

      const serviceRanking = Array.from(serviceRankingRaw.entries())
        .sort((first, second) => second[1].count - first[1].count)
        .map(([name, data]) => ({
          name,
          count: data.count,
          revenue: data.revenue,
          share: periodCompletedAppointments.length > 0 ? (data.count / periodCompletedAppointments.length) * 100 : 0,
        }));

      const rows: string[] = [];
      const pushRow = (...columns: Array<string | number>) => {
        rows.push(columns.map((value) => toCsvCell(value)).join(";"));
      };

      pushRow("RELATORIO PREMIUM - TESSY NAILS");
      pushRow("Gerado em", format(generatedAt, "dd/MM/yyyy HH:mm"));
      pushRow("Periodo", periodLabel);
      pushRow("Intervalo inicio", format(activeInterval.start, "dd/MM/yyyy HH:mm"));
      pushRow("Intervalo fim", format(activeInterval.end, "dd/MM/yyyy HH:mm"));
      rows.push("");

      pushRow("RESUMO EXECUTIVO");
      pushRow("Metrica", "Valor");
      pushRow("Receita realizada", toCurrency(periodRevenue));
      pushRow("Ticket medio", toCurrency(periodAverageTicket));
      pushRow("Atendimentos concluidos", periodCompletedAppointments.length);
      pushRow("Atendimentos em aberto", periodOpenAppointments.length);
      pushRow("Cancelados", periodCancelledAppointments.length);
      pushRow("Nao compareceu", periodNoShowAppointments.length);
      pushRow("Clientes unicos", periodUniqueClients);
      pushRow("Crescimento vs periodo anterior", `${activeGrowth}%`);
      rows.push("");

      pushRow("SERVICOS - RANKING");
      pushRow("Servico", "Concluidos", "Participacao", "Receita");
      if (serviceRanking.length === 0) {
        pushRow("Sem dados", 0, "0%", toCurrency(0));
      } else {
        serviceRanking.forEach((service) => {
          pushRow(service.name, service.count, `${service.share.toFixed(1)}%`, toCurrency(service.revenue));
        });
      }
      rows.push("");

      pushRow("ATENDIMENTOS DETALHADOS");
      pushRow("Data", "Hora", "Status", "Servico", "Cliente ID", "Valor referencia");
      if (detailedRows.length === 0) {
        pushRow("-", "-", "-", "Sem dados", "-", "-");
      } else {
        detailedRows.forEach((appointment) => {
          const appointmentDate = ensureDate(appointment.appointmentDate);
          const service = serviceById.get(appointment.serviceId);
          pushRow(
            format(appointmentDate, "dd/MM/yyyy"),
            format(appointmentDate, "HH:mm"),
            statusLabel(appointment.status),
            service?.name ?? "Servico removido",
            appointment.clientId ?? "",
            toCurrency(service?.price ?? 0)
          );
        });
      }

      const csv = `\uFEFF${rows.join("\n")}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `relatorio-premium-${activeFilter}-${format(generatedAt, "yyyy-MM-dd-HH-mm")}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success("Relatorio premium exportado com dados reais.");
    } catch (error) {
      console.error("Erro ao exportar relatorio:", error);
      toast.error("Nao foi possivel exportar o relatorio premium.");
    }
  };

  const clearClientFilters = () => {
    setClientSearch("");
    setClientStatusFilter("todos");
    setClientServiceFilter("todos");
    setClientDateMode("last_visit");
    setClientStartDate("");
    setClientEndDate("");
  };

  const exportClientReport = () => {
    try {
      const generatedAt = new Date();
      const rows: string[] = [];
      const pushRow = (...columns: Array<string | number>) => {
        rows.push(columns.map((value) => toCsvCell(value)).join(";"));
      };

      const selectedServiceName =
        clientServiceFilter === "todos"
          ? "Todos"
          : serviceById.get(clientServiceFilter)?.name ?? "Servico removido";

      pushRow("RELATORIO CLIENTES 360 - TESSY NAILS");
      pushRow("Gerado em", format(generatedAt, "dd/MM/yyyy HH:mm"));
      pushRow("Busca", clientSearch.trim() || "Todos");
      pushRow(
        "Status",
        clientStatusFilter === "todos"
          ? "Todos"
          : clientStatusFilter === "ativos"
            ? "Apenas ativos"
            : "Apenas inativos"
      );
      pushRow("Servico", selectedServiceName);
      pushRow("Base da data", clientDateMode === "created_at" ? "Data de cadastro" : "Ultimo atendimento");
      pushRow("Data inicio", clientStartDate || "-");
      pushRow("Data fim", clientEndDate || "-");
      rows.push("");

      pushRow("RESUMO");
      pushRow("Metrica", "Valor");
      pushRow("Clientes filtrados", filteredClientRows.length);
      pushRow("Clientes com atendimento", filteredClientsWithVisits);
      pushRow("Concluidos (historico)", filteredClientCompleted);
      pushRow("Receita estimada (historico)", toCurrency(filteredClientRevenue));
      pushRow("Ticket medio (historico)", toCurrency(filteredClientAverageTicket));
      rows.push("");

      pushRow("LISTA DETALHADA DE CLIENTES");
      pushRow(
        "Cliente",
        "Telefone",
        "Email",
        "Status",
        "Cadastro",
        "Ultimo atendimento",
        "Ultimo servico",
        "Historico recente",
        "Concluidos",
        "Total agendamentos",
        "Receita estimada"
      );

      if (filteredClientRows.length === 0) {
        pushRow("Sem dados", "-", "-", "-", "-", "-", "-", "-", 0, 0, toCurrency(0));
      } else {
        filteredClientRows.forEach((row) => {
          pushRow(
            row.client.name,
            row.client.phone || "-",
            row.client.email || "-",
            row.client.isActive !== false ? "Ativo" : "Inativo",
            format(ensureDate(row.client.createdAt), "dd/MM/yyyy"),
            row.lastCompletedDate || row.lastAppointmentDate
              ? format(row.lastCompletedDate || row.lastAppointmentDate || new Date(), "dd/MM/yyyy HH:mm")
              : "-",
            row.lastServiceName,
            row.recentServices.length > 0 ? row.recentServices.join(" | ") : "-",
            row.completedCount,
            row.totalAppointments,
            toCurrency(row.totalSpent)
          );
        });
      }

      const csv = `\uFEFF${rows.join("\n")}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `relatorio-clientes-360-${format(generatedAt, "yyyy-MM-dd-HH-mm")}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success("Relatorio de clientes exportado.");
    } catch (error) {
      console.error("Erro ao exportar relatorio de clientes:", error);
      toast.error("Nao foi possivel exportar o relatorio de clientes.");
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Relatorios Financeiros"
        description="Acompanhe o desempenho real do negocio com dados do Firestore."
        icon={BarChart3}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1.5 bg-white/40 rounded-2xl backdrop-blur-md border border-brand-accent/10 shadow-sm">
            {FILTERS.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "rounded-xl font-black text-[10px] uppercase tracking-wider px-4 h-9 transition-all",
                  activeFilter === filter
                    ? "bg-brand-primary text-white shadow-premium"
                    : "text-brand-text-sub opacity-50 hover:opacity-100"
                )}
              >
                {filter === "mes" ? "Mes" : filter === "periodo" ? "Periodo" : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={exportPremiumReport}
            disabled={loading}
            className="rounded-xl font-bold text-sm px-4 py-2 h-auto gap-2 bg-brand-primary hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <Download size={16} />
            Exportar Premium
          </Button>
        </div>
      </PageHeader>

      <PageHero
        title="Visao Geral do Negocio"
        subtitle="Metricas reais por periodo com base nos atendimentos gravados."
        metrics={[
          { label: `Receita (${periodLabel})`, value: toCurrency(periodRevenue), icon: DollarSign, variant: "primary" },
          { label: "Clientes no periodo", value: periodUniqueClients, icon: Users, variant: "success" },
          { label: "Ticket medio", value: toCurrency(periodAverageTicket), icon: Target, variant: "warning" },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
        <MetricCard
          title="Receita da Semana"
          value={toCurrency(weeklyRevenue)}
          icon={DollarSign}
          trend={{ value: Math.abs(weekGrowth), isPositive: weekGrowth >= 0 }}
          variant="primary"
        />
        <MetricCard
          title="Receita do Dia"
          value={toCurrency(dailyRevenue)}
          icon={Activity}
          trend={{ value: Math.abs(dayGrowth), isPositive: dayGrowth >= 0 }}
          variant="accent"
        />
        <MetricCard
          title="Receita do Mes"
          value={toCurrency(monthlyRevenue)}
          icon={TrendingUp}
          trend={{ value: Math.abs(activeGrowth), isPositive: activeGrowth >= 0 }}
          variant="success"
        />
        <MetricCard
          title="Concluidos no Periodo"
          value={periodCompletedAppointments.length}
          icon={Scissors}
          description={`${periodOpenAppointments.length} em aberto`}
          variant="warning"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3 mb-12">
        <SectionCard
          title="Evolucao Financeira"
          description="Faturamento real de atendimentos concluidos nos ultimos 6 meses"
          className="lg:col-span-2"
          icon={TrendingUp}
        >
          <div className="w-full h-[300px]">
            <RevenueChart data={chartRevenueData} />
          </div>
        </SectionCard>

        <SectionCard
          title="Distribuicao de Servicos"
          description="Percentual dos servicos concluidos no periodo selecionado"
          icon={BarChart3}
        >
          <div className="w-full h-[300px]">
            <ServicesDonut data={serviceDistribution} />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Relatorio de Clientes 360"
        description="Filtre por nome, periodo, servico e veja a ultima passagem de cada cliente."
        icon={UsersRound}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={clearClientFilters}
              className="rounded-xl font-bold"
            >
              Limpar Filtros
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={exportClientReport}
              className="rounded-xl font-bold gap-2"
            >
              <Download size={14} />
              Exportar Clientes
            </Button>
          </>
        }
        className="mb-12"
      >
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                Buscar Cliente
              </label>
              <div className="relative group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-sub opacity-40 group-focus-within:text-brand-primary"
                  size={18}
                />
                <Input
                  value={clientSearch}
                  onChange={(event) => setClientSearch(event.target.value)}
                  placeholder="Nome, telefone ou email"
                  className="pl-11 h-11 rounded-xl bg-white/50"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                Status
              </label>
              <select
                value={clientStatusFilter}
                onChange={(event) => setClientStatusFilter(event.target.value as ClientStatusFilter)}
                className="h-11 w-full rounded-xl border border-brand-accent/15 bg-white/60 px-3 text-sm font-bold text-brand-text-main outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              >
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
              </select>
            </div>

            <div>
              <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                Servico
              </label>
              <select
                value={clientServiceFilter}
                onChange={(event) => setClientServiceFilter(event.target.value)}
                className="h-11 w-full rounded-xl border border-brand-accent/15 bg-white/60 px-3 text-sm font-bold text-brand-text-main outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              >
                <option value="todos">Todos os servicos</option>
                {services
                  .slice()
                  .sort((first, second) => first.name.localeCompare(second.name))
                  .map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                Base da Data
              </label>
              <select
                value={clientDateMode}
                onChange={(event) => setClientDateMode(event.target.value as ClientDateMode)}
                className="h-11 w-full rounded-xl border border-brand-accent/15 bg-white/60 px-3 text-sm font-bold text-brand-text-main outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              >
                <option value="last_visit">Ultimo atendimento</option>
                <option value="created_at">Data de cadastro</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                Data Inicial
              </label>
              <Input
                type="date"
                value={clientStartDate}
                onChange={(event) => setClientStartDate(event.target.value)}
                className="h-11 rounded-xl bg-white/60"
              />
            </div>
            <div>
              <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                Data Final
              </label>
              <Input
                type="date"
                value={clientEndDate}
                onChange={(event) => setClientEndDate(event.target.value)}
                className="h-11 rounded-xl bg-white/60"
              />
            </div>
            <div className="rounded-2xl border border-brand-accent/10 bg-brand-soft/10 p-4">
              <p className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                Resultado Atual
              </p>
              <p className="mt-1 text-sm font-black text-brand-text-main">
                {filteredClientRows.length} clientes encontrados
              </p>
              <p className="text-xs font-bold text-brand-text-sub opacity-70">
                Receita estimada: {toCurrency(filteredClientRevenue)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-brand-accent/10 bg-white/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                Clientes Filtrados
              </p>
              <p className="mt-1 text-lg font-black text-brand-text-main">{filteredClientRows.length}</p>
            </div>
            <div className="rounded-2xl border border-brand-accent/10 bg-white/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                Com Atendimento
              </p>
              <p className="mt-1 text-lg font-black text-brand-text-main">{filteredClientsWithVisits}</p>
            </div>
            <div className="rounded-2xl border border-brand-accent/10 bg-white/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                Total Concluidos
              </p>
              <p className="mt-1 text-lg font-black text-brand-text-main">{filteredClientCompleted}</p>
            </div>
            <div className="rounded-2xl border border-brand-accent/10 bg-white/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                Ticket Medio
              </p>
              <p className="mt-1 text-lg font-black text-brand-text-main">{toCurrency(filteredClientAverageTicket)}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-brand-accent/10 bg-white/40">
            <Table>
              <TableHeader>
                <TableRow className="border-brand-accent/10 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                    Cliente
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                    Contato
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                    Ultimo Atendimento
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                    Ultimo Servico
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                    Historico Recente
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                    Concluidos
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
                    Receita Estimada
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientRows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-10 text-center text-sm font-bold text-brand-text-sub opacity-60">
                      Nenhum cliente encontrado para os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientRows.map((row) => {
                    const lastReferenceDate = row.lastCompletedDate ?? row.lastAppointmentDate;
                    return (
                      <TableRow key={row.client.id} className="border-brand-accent/10">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-black text-brand-text-main">{row.client.name}</p>
                            <Badge variant={row.client.isActive !== false ? "success" : "neutral"} size="xs">
                              {row.client.isActive !== false ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs font-bold text-brand-text-sub">
                            <p>{row.client.phone || "Sem telefone"}</p>
                            <p>{row.client.email || "Sem email"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lastReferenceDate ? (
                            <div className="space-y-1">
                              <p className="text-xs font-black text-brand-text-main">
                                {format(lastReferenceDate, "dd/MM/yyyy")}
                              </p>
                              <p className="text-[10px] font-bold text-brand-text-sub opacity-60">
                                {format(lastReferenceDate, "HH:mm")}
                              </p>
                            </div>
                          ) : (
                            <Badge variant="neutral" size="xs">Sem historico</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-black text-brand-text-main">{row.lastServiceName}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-brand-text-sub">
                            {row.recentServices.length > 0 ? row.recentServices.join(" | ") : "Sem servicos concluidos"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-black text-brand-text-main">
                            {row.completedCount} / {row.totalAppointments}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-xs font-black text-brand-text-main tabular-nums">
                            {toCurrency(row.totalSpent)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Insights do Periodo"
        description="Analise automatica baseada apenas em dados reais."
        icon={Activity}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-brand-soft/10 border border-brand-accent/5">
            <div className="w-12 h-12 rounded-xl bg-brand-success/20 flex items-center justify-center shrink-0 shadow-sm">
              <Scissors className="h-6 w-6 text-brand-success" strokeWidth={3} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-brand-text-main uppercase tracking-tight mb-1">Servico Popular</h4>
              <p className="text-sm font-bold text-brand-text-sub opacity-70 leading-relaxed">
                {topService.name} lidera com <span className="font-black text-brand-success">{topService.value}%</span> dos concluidos
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-brand-soft/10 border border-brand-accent/5">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center shrink-0 shadow-sm">
              <TrendingUp className="h-6 w-6 text-brand-primary" strokeWidth={3} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-brand-text-main uppercase tracking-tight mb-1">Pico de Atividade</h4>
              <p className="text-sm font-bold text-brand-text-sub opacity-70 leading-relaxed">
                {bestWeekDay.day} teve <span className="font-black text-brand-primary">{bestWeekDay.count}</span> atendimentos
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-brand-soft/10 border border-brand-accent/5">
            <div className="w-12 h-12 rounded-xl bg-brand-secondary/20 flex items-center justify-center shrink-0 shadow-sm">
              <Target className="h-6 w-6 text-brand-secondary" strokeWidth={3} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-brand-text-main uppercase tracking-tight mb-1">Produtividade</h4>
              <p className="text-sm font-bold text-brand-text-sub opacity-70 leading-relaxed">
                <span className="font-black text-brand-secondary">{periodCompletedAppointments.length}</span> concluidos no periodo
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-brand-soft/10 border border-brand-accent/5">
            <div className="w-12 h-12 rounded-xl bg-brand-accent/20 flex items-center justify-center shrink-0 shadow-sm">
              <DollarSign className="h-6 w-6 text-brand-accent" strokeWidth={3} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black text-brand-text-main uppercase tracking-tight mb-1">Status Financeiro</h4>
              <p className="text-sm font-bold text-brand-text-sub opacity-70 leading-relaxed">
                Crescimento: <span className="font-black text-brand-accent">{activeGrowth >= 0 ? "+" : ""}{activeGrowth}%</span>
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}
