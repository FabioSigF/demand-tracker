'use client';
import { useEffect, useState } from 'react';
import { formatDurationFull } from '@/lib/utils';

interface TimerDisplayProps {
  startedAt: Date | null;
  accumulated: number;
  isRunning: boolean;
}

export function TimerDisplay({ startedAt, accumulated, isRunning }: TimerDisplayProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning || !startedAt) {
      setSeconds(accumulated);
      return;
    }

    const update = () => {
      const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
      setSeconds(accumulated + elapsed);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt, accumulated, isRunning]);

  return (
    <span className="font-mono text-xs font-semibold tabular-nums text-foreground min-w-[56px] text-right">
      {formatDurationFull(seconds)}
    </span>
  );
}
