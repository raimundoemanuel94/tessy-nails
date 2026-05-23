/**
 * Tipos de Status para Agendamentos
 * Definição centralizada para evitar inconsistências
 */

// ✅ Status únicos definidos uma vez
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

// ✅ Configuração de cada status
export const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatus, {
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
  icon: string;
  description: string;
}> = {
  pending: {
    label: 'Pendente',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    dotColor: 'bg-amber-400',
    icon: '⏳',
    description: 'Aguardando confirmação',
  },
  confirmed: {
    label: 'Confirmado',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    dotColor: 'bg-emerald-500',
    icon: '✅',
    description: 'Agendamento confirmado',
  },
  completed: {
    label: 'Concluído',
    color: 'text-brand-primary',
    bgColor: 'bg-brand-soft/40',
    dotColor: 'bg-brand-primary',
    icon: '✔️',
    description: 'Serviço concluído',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    dotColor: 'bg-red-500',
    icon: '❌',
    description: 'Agendamento cancelado',
  },
  no_show: {
    label: 'Não Compareceu',
    color: 'text-slate-700',
    bgColor: 'bg-slate-50',
    dotColor: 'bg-slate-400',
    icon: '⚠️',
    description: 'Cliente não compareceu',
  },
};

// ✅ Helpers para status
export function getStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_CONFIG[status]?.label || status;
}

export function getStatusColor(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_CONFIG[status]?.color || 'text-gray-700';
}

export function getStatusBgColor(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_CONFIG[status]?.bgColor || 'bg-gray-100';
}

export function getStatusDotColor(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_CONFIG[status]?.dotColor || 'bg-gray-400';
}

export function getStatusIcon(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_CONFIG[status]?.icon || '○';
}

export function getStatusDescription(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_CONFIG[status]?.description || '';
}

// ✅ Validação de status
export function isValidStatus(status: unknown): status is AppointmentStatus {
  return typeof status === 'string' && status in APPOINTMENT_STATUS_CONFIG;
}

// ✅ Status que requerem ação
export const ACTIVE_STATUSES: AppointmentStatus[] = ['pending', 'confirmed'];

// ✅ Status que são finais
export const FINAL_STATUSES: AppointmentStatus[] = ['completed', 'cancelled', 'no_show'];

// ✅ Helper para saber se status é ativo
export function isActive(status: AppointmentStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

// ✅ Helper para saber se status é final
export function isFinal(status: AppointmentStatus): boolean {
  return FINAL_STATUSES.includes(status);
}
