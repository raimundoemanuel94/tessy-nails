/**
 * Hook para calcular métricas do dashboard
 * Separa lógica de negócio da UI
 */

import { useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ensureDate } from '@/lib/utils';

export interface DashboardMetrics {
  revenue: number;
  todayCount: number;
  clientCount: number;
  completionRate: number;
  upcomingCount: number;
  topServices: Array<{ name: string; count: number }>;
  chartData: Array<{ date: string; total: number }>;
}

export interface RawAppointment {
  id?: string;
  clientId: string;
  serviceId: string;
  appointmentDate: Date | string;
  status: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Client {
  id: string;
  name: string;
}

/**
 * Hook para calcular métricas do dashboard
 * Recebe dados brutos e retorna métricas processadas
 */
export function useDashboardMetrics(
  appointments: RawAppointment[],
  services: Service[],
  clients: Client[]
): DashboardMetrics {
  return useMemo(() => {
    // Criar mapa de preços
    const priceMap = new Map(services.map(s => [s.id, Number(s.price) || 0]));

    // Filtrar agendamentos completos
    const completed = appointments.filter(a => a.status === 'completed');

    // Contar agendamentos de hoje (excluindo cancelados e no_show)
    const todayAppts = appointments.filter(
      a => isToday(ensureDate(a.appointmentDate)) && 
           a.status !== 'cancelled' && 
           a.status !== 'no_show'
    );

    // Calcular receita
    const revenue = completed.reduce(
      (total, appt) => total + (priceMap.get(appt.serviceId) || 0),
      0
    );

    // Contar clientes únicos
    const clientSet = new Set(completed.map(a => a.clientId).filter(Boolean));

    // Taxa de conclusão
    const completionRate = appointments.length > 0 
      ? Math.round((completed.length / appointments.length) * 100)
      : 0;

    // Contar próximos (pending + confirmed)
    const upcoming = appointments.filter(
      a => (a.status === 'pending' || a.status === 'confirmed') &&
           (new Date(a.appointmentDate) >= new Date() || isToday(ensureDate(a.appointmentDate)))
    );

    // Top serviços
    const topServices = services
      .map(s => ({
        name: s.name,
        count: appointments.filter(
          a => a.serviceId === s.id && a.status === 'completed'
        ).length,
      }))
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Dados para gráfico (últimos 30 dias)
    const chartData = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const dateStr = format(d, 'dd/MM');

      const total = completed
        .filter(a => format(ensureDate(a.appointmentDate), 'dd/MM') === dateStr)
        .reduce((sum, a) => sum + (priceMap.get(a.serviceId) || 0), 0);

      return { date: dateStr, total };
    });

    return {
      revenue,
      todayCount: todayAppts.length,
      clientCount: clientSet.size,
      completionRate,
      upcomingCount: upcoming.length,
      topServices,
      chartData,
    };
  }, [appointments, services, clients]);
}

/**
 * Hook para calcular dados do gráfico com período customizável
 */
export function useChartData(
  allChartData: Array<{ date: string; total: number }>,
  period: 'week' | 'last14days' | 'last30days'
): Array<{ date: string; total: number }> {
  return useMemo(() => {
    const dayCount = period === 'week' ? 7 : period === 'last14days' ? 14 : 30;
    return allChartData.slice(-dayCount);
  }, [allChartData, period]);
}

/**
 * Helper para formatar valor monetário
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

/**
 * Helper para calcular percentual da meta
 */
export function calculateGoalPercentage(current: number, goal: number): number {
  return Math.min(Math.round((current / goal) * 100), 100);
}
