'use client';
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { getTimersForAnalytics } from '@/services/timers.service';
import { TimerEntry, Operation } from '@/types';
import {
  format,
  isWithinInterval,
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  subDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type PeriodFilter = 'today' | 'week' | 'month' | 'custom';

export interface AnalyticsFilters {
  period: PeriodFilter;
  from?: Date;
  to?: Date;
}

function getPeriodRange(filters: AnalyticsFilters): { from: Date; to: Date } {
  const now = new Date();
  switch (filters.period) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'week':
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'custom':
      return { from: filters.from ?? subDays(now, 7), to: filters.to ?? now };
  }
}

export function useAnalytics(filters: AnalyticsFilters) {
  const { user } = useAuthContext();
  const [timers, setTimers] = useState<TimerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getTimersForAnalytics(user.uid).then((data) => {
      setTimers(data);
      setLoading(false);
    });
  }, [user]);

  const { from, to } = getPeriodRange(filters);

  const filtered = timers.filter(t => {
    const date = t.startedAt ? t.startedAt.toDate() : null;
    if (!date) return false;
    return isWithinInterval(date, { start: from, end: to });
  });

  const byOperation = filtered.reduce((acc, t) => {
    acc[t.operation] = (acc[t.operation] || 0) + t.durationSeconds;
    return acc;
  }, {} as Record<Operation, number>);

  const timeByOperation = Object.entries(byOperation).map(([operation, seconds]) => ({
    operation: operation as Operation,
    seconds,
  }));

  const byDay = filtered.reduce((acc, t) => {
    if (!t.startedAt) return acc;
    const key = format(t.startedAt.toDate(), 'dd/MM', { locale: ptBR });
    acc[key] = (acc[key] || 0) + t.durationSeconds;
    return acc;
  }, {} as Record<string, number>);

  const timeByDay = Object.entries(byDay).map(([date, seconds]) => ({ date, seconds }));
  const totalSeconds = filtered.reduce((acc, t) => acc + t.durationSeconds, 0);

  return { timeByOperation, timeByDay, totalSeconds, loading, from, to };
}
