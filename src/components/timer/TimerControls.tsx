'use client';
import { Play, Pause, Square } from 'lucide-react';
import { useDemandTimer } from '@/hooks/useTimer';
import { Operation } from '@/types';
import { TimerDisplay } from './TimerDisplay';

interface TimerControlsProps {
  demandId: string;
  operation: Operation;
  onStopClick: (seconds: number, stopFn: (finalSeconds: number) => Promise<number>) => void;
}

export function TimerControls({ demandId, operation, onStopClick }: TimerControlsProps) {
  const { isRunning, isPaused, isActive, elapsed, start, pause, stop } = useDemandTimer(demandId, operation);

  const handleStop = () => {
    // Pass the function that actually calls stopTimer in firebase to the parent modal
    onStopClick(elapsed, stop);
  };

  // Get active startedAt timestamp from context if it's running
  // We can estimate it for display purposes
  const startedAt = isRunning ? new Date(Date.now() - (elapsed - (isPaused ? elapsed : 0)) * 1000) : null;

  return (
    <div className="flex items-center gap-2 bg-muted/30 hover:bg-muted/50 border border-border/80 px-2 py-1 rounded-lg shrink-0">
      {isActive && (
        <TimerDisplay
          startedAt={startedAt}
          accumulated={isPaused ? elapsed : 0}
          isRunning={isRunning}
        />
      )}

      <div className="flex items-center gap-1">
        {!isRunning ? (
          <button
            onClick={start}
            title="Iniciar controle de tempo"
            className="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/40 transition shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        ) : (
          <button
            onClick={pause}
            title="Pausar controle de tempo"
            className="p-1 rounded text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-950/40 transition shrink-0"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
          </button>
        )}

        {isActive && (
          <button
            onClick={handleStop}
            title="Encerrar e registrar tempo"
            className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition shrink-0"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        )}
      </div>
    </div>
  );
}
