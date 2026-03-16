import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ensureDate(date: any): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date.toDate === 'function') return date.toDate();
  if (date && typeof date === 'object' && 'seconds' in date) {
    return new Date(date.seconds * 1000);
  }
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Timezone de Sorriso-MT (America/Cuiaba - UTC-4)
export const SALON_TIMEZONE = 'America/Cuiaba';

// Obter hora atual no timezone do salão
export function getSalonTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: SALON_TIMEZONE }));
}

// Saudação dinâmica baseada no horário
export function getGreeting(): string {
  const now = getSalonTime();
  const hour = now.getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Bom dia';
  } else if (hour >= 12 && hour < 18) {
    return 'Boa tarde';
  } else {
    return 'Boa noite';
  }
}
