import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import { Status } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export function formatDurationFull(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export function fromTimestamp(ts: Timestamp): Date {
  return ts.toDate();
}

export function formatDateShort(date: Timestamp | Date): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  return format(d, 'dd/MM', { locale: ptBR });
}

export function formatDateFull(date: Timestamp | Date): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateInput(date: Timestamp | Date): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  return format(d, 'yyyy-MM-dd');
}

export function isDelayed(deadline: Timestamp, status: Status): boolean {
  if (status === 'Concluído' || status === 'Cancelado') return false;
  return isAfter(startOfDay(new Date()), startOfDay(deadline.toDate()));
}

export function generateOrder(existingOrders: number[]): number {
  if (existingOrders.length === 0) return 1000;
  return Math.max(...existingOrders) + 1000;
}

export function getInitials(email: string, displayName?: string): string {
  if (displayName) {
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}
