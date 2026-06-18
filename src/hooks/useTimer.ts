'use client';
import { useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTimerContext } from '@/contexts/TimerContext';
import {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  subscribeToTimers,
} from '@/services/timers.service';
import { TimerEntry, Operation } from '@/types';
import { toast } from 'sonner';

// ── Sync background timers from Firestore → React Context ────────────────────
export function useTimerSync() {
  const { user } = useAuthContext();
  const { setTimer } = useTimerContext();

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTimers(user.uid, (timers: TimerEntry[]) => {
      const active = timers.filter(t => t.status === 'running' || t.status === 'paused');
      active.forEach(t => {
        setTimer(t.demandId, {
          timerId:     t.id,
          demandId:    t.demandId,
          demandTitle: t.demandTitle ?? '',   // ← propaga demandTitle
          startedAt:   t.startedAt ? t.startedAt.toDate() : null,
          accumulated: t.durationSeconds,
          status:      t.status as 'running' | 'paused',
        });
      });
    });
    return unsubscribe;
  }, [user, setTimer]);
}

// ── Timer de uma demanda específica ──────────────────────────────────────────
export function useDemandTimer(
  demandId: string,
  operation: Operation,
  demandTitle: string   // ← novo parâmetro
) {
  const { user } = useAuthContext();
  const { activeTimers, setTimer, getElapsed } = useTimerContext();
  const activeTimer = activeTimers[demandId];

  const start = useCallback(async () => {
    if (!user) return;
    try {
      if (activeTimer?.status === 'paused') {
        await resumeTimer(activeTimer.timerId);
        setTimer(demandId, { ...activeTimer, startedAt: new Date(), status: 'running' });
      } else {
        // Passa demandTitle para ser salvo no documento do timer
        const timerId = await startTimer(user.uid, demandId, demandTitle, operation);
        setTimer(demandId, {
          timerId,
          demandId,
          demandTitle,
          startedAt: new Date(),
          accumulated: 0,
          status: 'running',
        });
      }
      toast.success('Timer iniciado');
    } catch {
      toast.error('Erro ao iniciar timer');
    }
  }, [user, demandId, demandTitle, operation, activeTimer, setTimer]);

  const pause = useCallback(async () => {
    if (!activeTimer) return;
    try {
      const elapsed = getElapsed(demandId);
      await pauseTimer(activeTimer.timerId, elapsed);
      setTimer(demandId, { ...activeTimer, startedAt: null, accumulated: elapsed, status: 'paused' });
      toast.success('Timer pausado');
    } catch {
      toast.error('Erro ao pausar timer');
    }
  }, [activeTimer, demandId, getElapsed, setTimer]);

  const stop = useCallback(async (finalSeconds?: number): Promise<number> => {
    if (!activeTimer) return 0;
    const elapsed = finalSeconds ?? getElapsed(demandId);
    try {
      await stopTimer(activeTimer.timerId, elapsed);
      setTimer(demandId, null);
      toast.success('Timer encerrado');
    } catch {
      toast.error('Erro ao encerrar timer');
    }
    return elapsed;
  }, [activeTimer, demandId, getElapsed, setTimer]);

  return {
    isRunning: activeTimer?.status === 'running',
    isPaused:  activeTimer?.status === 'paused',
    isActive:  !!activeTimer,
    elapsed:   getElapsed(demandId),
    start,
    pause,
    stop,
  };
}