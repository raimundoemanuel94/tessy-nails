"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useMemo, useState } from "react";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  Plus,
  Phone,
  Mail,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  UserPlus,
  Users,
  UserCheck,
  UserMinus,
  Download,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageHero } from "@/components/shared/PageHero";
import { SectionCard } from "@/components/shared/SectionCard";
import { MetricCard } from "@/components/shared/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientForm } from "@/components/shared/ClientForm";
import { appointmentService } from "@/services/appointments";
import { clientService } from "@/services/clients";
import { globalStore } from "@/store/globalStore";
import { Appointment, Client, Service } from "@/types";
import { ensureDate } from "@/lib/utils";
import { toast } from "sonner";

type ClientStatusFilter = "all" | "active" | "inactive";
type SegmentFilter = "all" | "new" | "vip" | "at_risk" | "no_appointments";
type DateBaseFilter = "created_at" | "last_visit";
type SortOption =
  | "name_asc"
  | "name_desc"
  | "created_desc"
  | "created_asc"
  | "last_visit_desc"
  | "last_visit_asc"
  | "appointments_desc"
  | "appointments_asc"
  | "spent_desc"
  | "spent_asc";

type ClientInsightRow = {
  client: Client;
  createdAt: Date;
  appointments: Appointment[];
  completedAppointments: Appointment[];
  totalAppointments: number;
  completedCount: number;
  totalSpent: number;
  lastAppointmentDate: Date | null;
  lastVisitDate: Date | null;
  lastServiceId: string | null;
  lastServiceName: string;
  isNew: boolean;
  isVip: boolean;
  isAtRisk: boolean;
  daysSinceVisit: number | null;
};

const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

function toCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toCsvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function parseDateInput(value: string, endOfDay = false): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getSegment(row: ClientInsightRow): { label: string; variant: "success" | "warning" | "neutral" | "default" } {
  if (row.totalAppointments === 0) return { label: "Sem agendamento", variant: "warning" };
  if (row.isAtRisk) return { label: "Sem retorno +60d", variant: "neutral" };
  if (row.isVip) return { label: "Vip recorrente", variant: "success" };
  if (row.isNew) return { label: "Novo cliente", variant: "warning" };
  return { label: "Ativa", variant: "default" };
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>("all");
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateBaseFilter, setDateBaseFilter] = useState<DateBaseFilter>("last_visit");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [minAppointmentsInput, setMinAppointmentsInput] = useState("");
  const [maxAppointmentsInput, setMaxAppointmentsInput] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("last_visit_desc");
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);

  const reloadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const [clientsData, appointmentsData, servicesData] = await Promise.all([
        clientService.getAll(),
        appointmentService.getAll(),
        globalStore.fetchServices(false),
      ]);

      setClients(clientsData);
      setAppointments(appointmentsData);
      setServices(servicesData);
    } catch (error) {
      console.error("Error loading clients dashboard:", error);
      toast.error("Nao foi possivel carregar os dados reais de clientes.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadData(false);
  }, [reloadData]);

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

  const appointmentsByClient = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((appointment) => {
      const current = map.get(appointment.clientId) ?? [];
      current.push(appointment);
      map.set(appointment.clientId, current);
    });
    return map;
  }, [appointments]);

  const clientRows = useMemo<ClientInsightRow[]>(() => {
    const now = new Date();

    return clients.map((client) => {
      const createdAt = ensureDate(client.createdAt);
      const timeline = [...(appointmentsByClient.get(client.id) ?? [])].sort(
        (first, second) =>
          ensureDate(second.appointmentDate).getTime() - ensureDate(first.appointmentDate).getTime()
      );
      const completedAppointments = timeline.filter((appointment) => appointment.status === "completed");
      const lastAppointmentDate = timeline.length > 0 ? ensureDate(timeline[0].appointmentDate) : null;
      const savedLastVisit = client.lastVisit ? ensureDate(client.lastVisit) : null;

      let lastVisitDate: Date | null = lastAppointmentDate;
      if (!lastVisitDate || (savedLastVisit && savedLastVisit.getTime() > lastVisitDate.getTime())) {
        lastVisitDate = savedLastVisit;
      }

      const lastServiceId = timeline[0]?.serviceId ?? null;
      const lastServiceName = lastServiceId
        ? serviceById.get(lastServiceId)?.name ?? "Servico removido"
        : "Sem servico";

      const totalSpent = completedAppointments.reduce(
        (total, appointment) => total + (serviceById.get(appointment.serviceId)?.price ?? 0),
        0
      );

      const totalAppointments = timeline.length;
      const completedCount = completedAppointments.length;
      const daysSinceVisit = lastVisitDate ? differenceInDays(now, lastVisitDate) : null;
      const isNew = differenceInDays(now, createdAt) <= 30;
      const isVip = totalAppointments >= 5;
      const isAtRisk = daysSinceVisit !== null && daysSinceVisit > 60;

      return {
        client,
        createdAt,
        appointments: timeline,
        completedAppointments,
        totalAppointments,
        completedCount,
        totalSpent,
        lastAppointmentDate,
        lastVisitDate,
        lastServiceId,
        lastServiceName,
        isNew,
        isVip,
        isAtRisk,
        daysSinceVisit,
      };
    });
  }, [appointmentsByClient, clients, serviceById]);

  const startDateBoundary = useMemo(() => parseDateInput(dateStart, false), [dateStart]);
  const endDateBoundary = useMemo(() => parseDateInput(dateEnd, true), [dateEnd]);

  const minAppointments = useMemo(() => {
    const parsed = Number(minAppointmentsInput);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }, [minAppointmentsInput]);

  const maxAppointments = useMemo(() => {
    const parsed = Number(maxAppointmentsInput);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }, [maxAppointmentsInput]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);
    const queryDigits = onlyDigits(searchQuery);

    return clientRows.filter((row) => {
      if (statusFilter === "active" && row.client.isActive === false) return false;
      if (statusFilter === "inactive" && row.client.isActive !== false) return false;

      if (segmentFilter === "new" && !row.isNew) return false;
      if (segmentFilter === "vip" && !row.isVip) return false;
      if (segmentFilter === "at_risk" && !row.isAtRisk) return false;
      if (segmentFilter === "no_appointments" && row.totalAppointments > 0) return false;

      if (serviceFilter !== "all") {
        const hasService = row.appointments.some((appointment) => appointment.serviceId === serviceFilter);
        if (!hasService) return false;
      }

      if (minAppointments !== null && row.totalAppointments < minAppointments) return false;
      if (maxAppointments !== null && row.totalAppointments > maxAppointments) return false;

      if (startDateBoundary || endDateBoundary) {
        const referenceDate = dateBaseFilter === "created_at" ? row.createdAt : row.lastVisitDate;
        if (!referenceDate) return false;
        if (startDateBoundary && referenceDate.getTime() < startDateBoundary.getTime()) return false;
        if (endDateBoundary && referenceDate.getTime() > endDateBoundary.getTime()) return false;
      }

      if (normalizedQuery || queryDigits) {
        const searchableText = normalizeText(
          `${row.client.name} ${row.client.email ?? ""} ${row.lastServiceName}`
        );
        const phoneDigits = onlyDigits(row.client.phone ?? "");

        const matchesText = normalizedQuery ? searchableText.includes(normalizedQuery) : false;
        const matchesPhone = queryDigits ? phoneDigits.includes(queryDigits) : false;

        if (!matchesText && !matchesPhone) return false;
      }

      return true;
    });
  }, [
    clientRows,
    dateBaseFilter,
    endDateBoundary,
    maxAppointments,
    minAppointments,
    searchQuery,
    segmentFilter,
    serviceFilter,
    startDateBoundary,
    statusFilter,
  ]);

  const sortedRows = useMemo(() => {
    const list = [...filteredRows];

    list.sort((first, second) => {
      if (sortBy === "name_asc") return first.client.name.localeCompare(second.client.name);
      if (sortBy === "name_desc") return second.client.name.localeCompare(first.client.name);
      if (sortBy === "created_desc") return second.createdAt.getTime() - first.createdAt.getTime();
      if (sortBy === "created_asc") return first.createdAt.getTime() - second.createdAt.getTime();
      if (sortBy === "last_visit_desc") {
        const firstTime = first.lastVisitDate?.getTime() ?? 0;
        const secondTime = second.lastVisitDate?.getTime() ?? 0;
        return secondTime - firstTime;
      }
      if (sortBy === "last_visit_asc") {
        const firstTime = first.lastVisitDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const secondTime = second.lastVisitDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return firstTime - secondTime;
      }
      if (sortBy === "appointments_desc") return second.totalAppointments - first.totalAppointments;
      if (sortBy === "appointments_asc") return first.totalAppointments - second.totalAppointments;
      if (sortBy === "spent_desc") return second.totalSpent - first.totalSpent;
      if (sortBy === "spent_asc") return first.totalSpent - second.totalSpent;
      return second.createdAt.getTime() - first.createdAt.getTime();
    });

    return list;
  }, [filteredRows, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    dateBaseFilter,
    dateEnd,
    dateStart,
    maxAppointmentsInput,
    minAppointmentsInput,
    rowsPerPage,
    searchQuery,
    segmentFilter,
    serviceFilter,
    sortBy,
    statusFilter,
  ]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedRows.length / rowsPerPage)),
    [rowsPerPage, sortedRows.length]
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedRows.slice(start, end);
  }, [currentPage, rowsPerPage, sortedRows]);

  const baseTotals = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((client) => client.isActive !== false).length;
    const inactive = total - active;
    const atRisk = clientRows.filter((row) => row.isAtRisk).length;
    return { total, active, inactive, atRisk };
  }, [clientRows, clients]);

  const filteredMetrics = useMemo(() => {
    const total = sortedRows.length;
    const active = sortedRows.filter((row) => row.client.isActive !== false).length;
    const withAppointments = sortedRows.filter((row) => row.totalAppointments > 0).length;
    const completed = sortedRows.reduce((acc, row) => acc + row.completedCount, 0);
    const spent = sortedRows.reduce((acc, row) => acc + row.totalSpent, 0);
    const avgTicket = completed > 0 ? spent / completed : 0;
    return { total, active, withAppointments, completed, spent, avgTicket };
  }, [sortedRows]);

  const topRevenueClient = useMemo(() => {
    if (sortedRows.length === 0) return null;
    return [...sortedRows].sort((a, b) => b.totalSpent - a.totalSpent)[0];
  }, [sortedRows]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSegmentFilter("all");
    setServiceFilter("all");
    setDateBaseFilter("last_visit");
    setDateStart("");
    setDateEnd("");
    setMinAppointmentsInput("");
    setMaxAppointmentsInput("");
    setSortBy("last_visit_desc");
    setRowsPerPage(12);
  };

  const handleExport = () => {
    try {
      const generatedAt = new Date();
      const rows: string[] = [];
      const pushRow = (...columns: Array<string | number>) => {
        rows.push(columns.map((value) => toCsvCell(value)).join(";"));
      };

      pushRow("RELATORIO PREMIUM CLIENTES - TESSY NAILS");
      pushRow("Gerado em", format(generatedAt, "dd/MM/yyyy HH:mm"));
      pushRow("Total filtrado", sortedRows.length);
      pushRow("Status", statusFilter);
      pushRow("Segmento", segmentFilter);
      pushRow("Servico", serviceFilter === "all" ? "todos" : serviceById.get(serviceFilter)?.name ?? serviceFilter);
      pushRow("Base data", dateBaseFilter);
      pushRow("Data inicio", dateStart || "-");
      pushRow("Data fim", dateEnd || "-");
      pushRow("Busca", searchQuery || "todas");
      rows.push("");

      pushRow(
        "Cliente",
        "Status",
        "Segmento",
        "Telefone",
        "Email",
        "Cadastro",
        "Ultima visita",
        "Ultimo servico",
        "Concluidos",
        "Total agendamentos",
        "Receita estimada"
      );

      if (sortedRows.length === 0) {
        pushRow("Sem dados", "-", "-", "-", "-", "-", "-", "-", 0, 0, toCurrency(0));
      } else {
        sortedRows.forEach((row) => {
          const segment = getSegment(row);
          pushRow(
            row.client.name,
            row.client.isActive !== false ? "Ativo" : "Inativo",
            segment.label,
            row.client.phone || "-",
            row.client.email || "-",
            format(row.createdAt, "dd/MM/yyyy"),
            row.lastVisitDate ? format(row.lastVisitDate, "dd/MM/yyyy HH:mm") : "-",
            row.lastServiceName,
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
      anchor.download = `clientes-premium-${format(generatedAt, "yyyy-MM-dd-HH-mm")}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success("Relatorio de clientes exportado.");
    } catch (error) {
      console.error("Error exporting clients report:", error);
      toast.error("Nao foi possivel exportar o relatorio de clientes.");
    }
  };

  const openCreateDialog = () => {
    setEditingClient(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Tem certeza que deseja desativar esta cliente?")) return;
    setActionLoading(id);
    try {
      await clientService.deactivate(id);
      toast.success("Cliente desativada com sucesso.");
      await reloadData(true);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao desativar cliente.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (id: string) => {
    setActionLoading(id);
    try {
      await clientService.update(id, { isActive: true });
      toast.success("Cliente reativada com sucesso.");
      await reloadData(true);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao reativar cliente.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm("ATENCAO: exclusao permanente. Deseja continuar?")) return;
    setActionLoading(id);
    try {
      await clientService.hardDelete(id);
      toast.success("Cliente removida permanentemente.");
      await reloadData(true);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir cliente.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Clientes Premium"
        description="Visao real da base com filtros avancados, segmentacao e relatorio inteligente."
        icon={Users}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            className="gap-2 rounded-xl"
            onClick={handleExport}
          >
            <Download size={16} />
            Exportar CSV
          </Button>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingClient(null);
            }}
          >
            <DialogTrigger
              render={
                <Button className="gap-2" size="lg" onClick={openCreateDialog}>
                  <Plus size={20} className="stroke-3" />
                  Nova Cliente
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingClient ? "Editar Cliente" : "Nova Cliente"}</DialogTitle>
              </DialogHeader>
              <ClientForm
                client={editingClient}
                onSuccess={async () => {
                  setIsDialogOpen(false);
                  setEditingClient(null);
                  await reloadData(false);
                }}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setEditingClient(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <PageHero
        title="Sua Comunidade"
        subtitle="Dados reais do Firestore para crescimento, atividade e fidelidade da base."
        metrics={[
          { label: "Total real", value: baseTotals.total, icon: Users },
          { label: "Ativas", value: baseTotals.active, icon: UserCheck },
          { label: "Sem retorno +60d", value: baseTotals.atRisk, icon: AlertTriangle },
        ]}
      />

      <SectionCard
        title="Busca Avancada e Segmentacao"
        description="Filtre por nome, status, servico, periodo, faixa de agendamentos e ordenacao."
        icon={Sparkles}
        actions={
          <Button variant="outline" size="sm" className="rounded-xl font-bold" onClick={clearFilters}>
            Limpar filtros
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
              Busca inteligente
            </label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-sub opacity-40 group-focus-within:text-brand-primary transition-colors" size={18} />
              <Input
                placeholder="Nome, email, telefone ou ultimo servico"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-11 h-11 rounded-xl border-brand-accent/15 bg-white/60"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ClientStatusFilter)}
              className="h-11 w-full rounded-xl border border-brand-accent/15 bg-white/60 px-3 text-sm font-bold text-brand-text-main outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
            >
              <option value="all">Todas</option>
              <option value="active">Somente ativas</option>
              <option value="inactive">Somente inativas</option>
            </select>
          </div>

          <div>
            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
              Segmento
            </label>
            <select
              value={segmentFilter}
              onChange={(event) => setSegmentFilter(event.target.value as SegmentFilter)}
              className="h-11 w-full rounded-xl border border-brand-accent/15 bg-white/60 px-3 text-sm font-bold text-brand-text-main outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
            >
              <option value="all">Todos</option>
              <option value="new">Novas (30 dias)</option>
              <option value="vip">Vip recorrentes (5+)</option>
              <option value="at_risk">Sem retorno +60 dias</option>
              <option value="no_appointments">Sem agendamentos</option>
            </select>
          </div>

          <div>
            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
              Servico
            </label>
            <select
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
              className="h-11 w-full rounded-xl border border-brand-accent/15 bg-white/60 px-3 text-sm font-bold text-brand-text-main outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
            >
              <option value="all">Todos os servicos</option>
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
              Base da data
            </label>
            <select
              value={dateBaseFilter}
              onChange={(event) => setDateBaseFilter(event.target.value as DateBaseFilter)}
              className="h-11 w-full rounded-xl border border-brand-accent/15 bg-white/60 px-3 text-sm font-bold text-brand-text-main outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
            >
              <option value="last_visit">Ultima visita</option>
              <option value="created_at">Data de cadastro</option>
            </select>
          </div>

          <div>
            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
              Data inicial
            </label>
            <Input type="date" value={dateStart} onChange={(event) => setDateStart(event.target.value)} className="h-11 rounded-xl bg-white/60" />
          </div>

          <div>
            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
              Data final
            </label>
            <Input type="date" value={dateEnd} onChange={(event) => setDateEnd(event.target.value)} className="h-11 rounded-xl bg-white/60" />
          </div>

          <div>
            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-11 w-full rounded-xl border border-brand-accent/15 bg-white/60 px-3 text-sm font-bold text-brand-text-main outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
            >
              <option value="last_visit_desc">Ultima visita (mais recente)</option>
              <option value="last_visit_asc">Ultima visita (mais antiga)</option>
              <option value="name_asc">Nome (A-Z)</option>
              <option value="name_desc">Nome (Z-A)</option>
              <option value="appointments_desc">Agendamentos (maior)</option>
              <option value="appointments_asc">Agendamentos (menor)</option>
              <option value="spent_desc">Receita estimada (maior)</option>
              <option value="spent_asc">Receita estimada (menor)</option>
              <option value="created_desc">Cadastro (mais recente)</option>
              <option value="created_asc">Cadastro (mais antigo)</option>
            </select>
          </div>

          <div>
            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
              Min agendamentos
            </label>
            <Input
              type="number"
              min={0}
              placeholder="Ex: 1"
              value={minAppointmentsInput}
              onChange={(event) => setMinAppointmentsInput(event.target.value)}
              className="h-11 rounded-xl bg-white/60"
            />
          </div>

          <div>
            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
              Max agendamentos
            </label>
            <Input
              type="number"
              min={0}
              placeholder="Ex: 10"
              value={maxAppointmentsInput}
              onChange={(event) => setMaxAppointmentsInput(event.target.value)}
              className="h-11 rounded-xl bg-white/60"
            />
          </div>

          <div>
            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
              Linhas por pagina
            </label>
            <select
              value={rowsPerPage}
              onChange={(event) => setRowsPerPage(Number(event.target.value))}
              className="h-11 w-full rounded-xl border border-brand-accent/15 bg-white/60 px-3 text-sm font-bold text-brand-text-main outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total filtrado"
          value={filteredMetrics.total}
          icon={Users}
          description="Clientes no resultado atual"
          variant="primary"
        />
        <MetricCard
          title="Ativas no filtro"
          value={filteredMetrics.active}
          icon={UserCheck}
          description={`${filteredMetrics.withAppointments} com historico`}
          variant="success"
        />
        <MetricCard
          title="Concluidos"
          value={filteredMetrics.completed}
          icon={Sparkles}
          description="Atendimentos concluidos no historico filtrado"
          variant="warning"
        />
        <MetricCard
          title="Ticket medio"
          value={toCurrency(filteredMetrics.avgTicket)}
          icon={AlertTriangle}
          description={`Receita estimada: ${toCurrency(filteredMetrics.spent)}`}
          variant="accent"
        />
      </div>

      <SectionCard
        title="Lista de Clientes Premium"
        description={`Mostrando ${paginatedRows.length} de ${sortedRows.length} clientes filtradas.`}
      >
        <div className="mb-4 rounded-2xl border border-brand-accent/10 bg-brand-soft/10 p-4">
          <p className="text-xs font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
            Insight rapido
          </p>
          <p className="mt-1 text-sm font-bold text-brand-text-main">
            {topRevenueClient
              ? `${topRevenueClient.client.name} lidera em receita estimada (${toCurrency(topRevenueClient.totalSpent)}).`
              : "Sem dados de receita para exibir no filtro atual."}
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-brand-accent/10 bg-white/40">
          <Table>
            <TableHeader>
              <TableRow className="border-brand-accent/10 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">Cliente</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">Contato</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">Segmento</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">Historico</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">Ultima visita</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">Ultimo servico</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">Receita</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="py-12 text-center text-sm font-bold text-brand-text-sub opacity-60">
                    Nenhuma cliente encontrada para os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row) => {
                  const segment = getSegment(row);
                  const client = row.client;

                  return (
                    <TableRow key={client.id} className="group border-brand-accent/5 hover:bg-brand-soft/10 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-xl border border-brand-accent/10 shadow-sm">
                            <AvatarImage src={client.photoURL} />
                            <AvatarFallback className="bg-linear-to-br from-brand-primary to-brand-secondary text-white font-black">
                              {client.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-black text-brand-text-main group-hover:text-brand-primary transition-colors tracking-tight">
                              {client.name}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-brand-text-sub opacity-40">
                              Desde {format(row.createdAt, "MMM yyyy", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-brand-soft/20 flex items-center justify-center text-brand-text-sub">
                              <Mail size={12} />
                            </div>
                            <span className="text-xs font-bold text-brand-text-main">{client.email || "Sem email"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-brand-soft/20 flex items-center justify-center text-brand-text-sub">
                              <Phone size={12} />
                            </div>
                            <span className="text-xs font-bold text-brand-text-main">{client.phone || "Sem telefone"}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <Badge variant={client.isActive !== false ? "success" : "neutral"} size="xs" className="font-black">
                            {client.isActive !== false ? "Ativa" : "Inativa"}
                          </Badge>
                          <Badge variant={segment.variant} size="xs" className="font-black">
                            {segment.label}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs font-black text-brand-text-main">
                          {row.completedCount} concluidos / {row.totalAppointments} total
                        </span>
                      </TableCell>

                      <TableCell>
                        {row.lastVisitDate ? (
                          <div className="space-y-0.5">
                            <p className="text-xs font-black text-brand-text-main">
                              {format(row.lastVisitDate, "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-[10px] font-bold text-brand-text-sub opacity-60">
                              {row.daysSinceVisit === null ? "-" : `${row.daysSinceVisit} dias`}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="neutral" size="xs">Nunca</Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="text-xs font-black text-brand-text-main">
                          {row.lastServiceName}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="text-xs font-black text-brand-text-main tabular-nums">
                          {toCurrency(row.totalSpent)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={actionLoading === client.id}
                                className="h-9 w-9 rounded-xl hover:bg-brand-primary/10 text-brand-text-sub hover:text-brand-primary transition-all"
                              >
                                {actionLoading === client.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-5 w-5" />
                                )}
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="rounded-2xl border border-brand-accent/10 p-2 shadow-premium-xl bg-white">
                            <DropdownMenuItem onClick={() => handleEdit(client)} className="rounded-xl font-bold cursor-pointer">
                              <Edit className="h-4 w-4 mr-2 text-brand-primary" />
                              Editar
                            </DropdownMenuItem>
                            {client.isActive !== false ? (
                              <DropdownMenuItem className="rounded-xl font-bold text-amber-600 focus:text-amber-600 cursor-pointer" onClick={() => client.id && handleDeactivate(client.id)}>
                                <UserMinus className="h-4 w-4 mr-2" />
                                Desativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="rounded-xl font-bold text-emerald-600 focus:text-emerald-600 cursor-pointer" onClick={() => client.id && handleReactivate(client.id)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Reativar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="rounded-xl font-black text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer" onClick={() => client.id && handleHardDelete(client.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir Permanente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-brand-accent/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-black uppercase tracking-[2px] text-brand-text-sub opacity-50">
            Pagina {currentPage} de {totalPages} · Base real: {baseTotals.total} clientes · Inativas: {baseTotals.inactive}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="rounded-xl px-4 font-bold"
            >
              Anterior
            </Button>
            <Button
              variant="default"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-xl px-4 font-bold"
            >
              Proxima
            </Button>
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}
