'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

interface ActiveTimer {
  timerId: string;
  demandId: string;
  startedAt: Date | null;
  accumulated: number;
  status: 'running' | 'paused';
}

interface TimerContextType {
  activeTimers: Record<string, ActiveTimer>;
  setTimer: (demandId: string, timer: ActiveTimer | null) => void;
  getElapsed: (demandId: string) => number;
}

const TimerContext = createContext<TimerContextType | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTimers, setActiveTimers] = useState<Record<string, ActiveTimer>>({});

  const setTimer = useCallback((demandId: string, timer: ActiveTimer | null) => {
    setActiveTimers(prev => {
      if (timer === null) {
        const next = { ...prev };
        delete next[demandId];
        return next;
      }
      return { ...prev, [demandId]: timer };
    });
  }, []);

  const getElapsed = useCallback((demandId: string): number => {
    const t = activeTimers[demandId];
    if (!t) return 0;
    if (t.status === 'paused') return t.accumulated;
    if (!t.startedAt) return t.accumulated;
    return t.accumulated + Math.floor((Date.now() - t.startedAt.getTime()) / 1000);
  }, [activeTimers]);

  return (
    <TimerContext.Provider value={{ activeTimers, setTimer, getElapsed }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimerContext() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimerContext must be inside TimerProvider');
  return ctx;
}
