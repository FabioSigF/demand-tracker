'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { subscribeToTimersForAnalytics } from '@/services/timers.service';
import { TimerEntry } from '@/types';
import {
  format,
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

export interface TimeByDemand {
  demandId: string;
  demandTitle: string;
  operation: string;
  seconds: number;
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
  const [timers,  setTimers]  = useState<TimerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Calcula o range uma vez por mudança de filters
  const range = useMemo(() => getPeriodRange(filters), [filters]);

  /**
   * Estabiliza from/to como números primitivos (ms).
   * Números são comparados por valor — não por referência como objetos Date.
   * Isso evita o loop: setTimers → re-render → novo Date() → useEffect dispara
   * novamente → setTimers → ...
   */
  const fromMs = range.from.getTime();
  const toMs   = range.to.getTime();

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    // Reconstrói Date a partir dos primitivos estáveis
    const unsub = subscribeToTimersForAnalytics(
      user.uid,
      new Date(fromMs),
      new Date(toMs),
      (data) => {
        setTimers(data);
        setLoading(false);
      }
    );
    return unsub;
  // fromMs e toMs são number — React compara por valor, sem loop
  }, [user, fromMs, toMs]);

  // ── Agrupamentos ──────────────────────────────────────────────────────────

  const timeByOperation = useMemo(() => {
    const byOp = timers.reduce((acc, t) => {
      acc[t.operation] = (acc[t.operation] || 0) + t.durationSeconds;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byOp).map(([operation, seconds]) => ({
      operation,
      seconds,
    }));
  }, [timers]);

  const timeByDemand = useMemo((): TimeByDemand[] => {
    const byDemand = timers.reduce((acc, t) => {
      const key = t.demandId;
      if (!acc[key]) {
        acc[key] = {
          demandId:    t.demandId,
          demandTitle: t.demandTitle ?? t.demandId,
          operation:   t.operation,
          seconds:     0,
        };
      }
      acc[key].seconds += t.durationSeconds;
      return acc;
    }, {} as Record<string, TimeByDemand>);

    return Object.values(byDemand).sort((a, b) => b.seconds - a.seconds);
  }, [timers]);

  const timeByDay = useMemo(() => {
    const byDay = timers.reduce((acc, t) => {
      if (!t.endedAt) return acc;
      const key = format(t.endedAt.toDate(), 'dd/MM', { locale: ptBR });
      acc[key] = (acc[key] || 0) + t.durationSeconds;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byDay).map(([date, seconds]) => ({ date, seconds }));
  }, [timers]);

  const totalSeconds = useMemo(
    () => timers.reduce((acc, t) => acc + t.durationSeconds, 0),
    [timers]
  );

  const daysWithRecords = useMemo(() => {
    const days = new Set(
      timers
        .filter(t => t.endedAt)
        .map(t => format(t.endedAt!.toDate(), 'yyyy-MM-dd'))
    );
    return days.size;
  }, [timers]);

  return {
    timeByOperation,
    timeByDemand,
    timeByDay,
    totalSeconds,
    daysWithRecords,
    loading,
    from: range.from,
    to:   range.to,
  };
}