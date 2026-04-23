import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ensureDate(date: unknown): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as {toDate: unknown}).toDate === 'function') return (date as {toDate: () => Date}).toDate();
  if (typeof date === 'object' && date !== null && 'seconds' in date) {
    return new Date((date as {seconds: number}).seconds * 1000);
  }
  const parsed = new Date(date as string | number);
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
