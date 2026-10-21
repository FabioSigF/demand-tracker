'use client';
import { useState } from 'react';
import { Demand } from '@/types';
import { Task } from '@/types/index';
import { OperationBadge } from './OperationBadge';
import { StatusBadge } from './StatusBadge';
import { DelayedBadge } from './DelayedBadge';
import { TimerControls } from '../timer/TimerControls';
import { Trash2, Calendar, Eye, ListTodo, ChevronDown, User, Circle } from 'lucide-react';
import { formatDateShort, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfirm } from '@/contexts/ConfirmModalContext';

interface DemandMobileCardProps {
  demand: Demand;
  openTasks?: Task[];
  onOpenTaskDetails?: (taskId: string) => void;
  onToggleTaskStatus?: (task: Task) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenDetails: (demand: Demand) => void;
  onStopTimerClick: (seconds: number, stopFn: (finalSeconds: number) => Promise<number>) => void;
  showCompletedDate?: boolean;
}

export function DemandMobileCard({
  demand,
  openTasks = [],
  onOpenTaskDetails,
  onToggleTaskStatus,
  onDelete,
  onOpenDetails,
  onStopTimerClick,
  showCompletedDate
}: DemandMobileCardProps) {
  const { confirm } = useConfirm();
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);

  const handleDeleteRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Excluir demanda',
      description: 'Esta ação não poderá ser desfeita. Deseja realmente excluir esta demanda?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await onDelete(demand.id);
      toast.success('Demanda excluída');
    } catch {
      toast.error('Erro ao excluir demanda');
    }
  };

  const handleTimerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={() => onOpenDetails(demand)}
      className="bg-card border border-border/80 rounded-2xl p-4 space-y-3.5 shadow-sm hover:border-violet-500/30 transition duration-150 active:scale-[0.99] cursor-pointer relative overflow-hidden group"
    >
      {/* Top row: ID, Operation and Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-violet-500 text-xs">
            {demand.demandId || '—'}
          </span>
          <OperationBadge operation={demand.operation} className="text-[10px] px-1.5 py-0" />
        </div>
        <StatusBadge status={demand.status} className="text-[10px] px-1.5 py-0" />
      </div>

      {/* Demand Title & Requester */}
      <div className="space-y-1">
        <h4 className="font-semibold text-foreground text-sm leading-snug">
          {demand.task || <span className="text-muted-foreground italic">Sem título</span>}
        </h4>
        {demand.requester && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="w-3 h-3 text-muted-foreground/70 shrink-0" />
            <span className="truncate">{demand.requester}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <DelayedBadge deadline={demand.deadline} status={demand.status} />
        </div>
      </div>

      {/* Dates block */}
      <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-border/40 py-2 tabular-nums">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <span>Início:</span>
          <span className="text-foreground font-semibold">
            {demand.startDate ? formatDateShort(demand.startDate) : '—'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <span>{showCompletedDate ? 'Fim:' : 'Prazo:'}</span>
          <span className="text-foreground font-semibold">
            {showCompletedDate ? (
              demand.completedAt ? formatDateShort(demand.completedAt) : '—'
            ) : (
              demand.deadline ? formatDateShort(demand.deadline) : '—'
            )}
          </span>
        </div>
      </div>

      {/* Notes summary */}
      {demand.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/30 p-2 rounded-lg">
          {demand.notes}
        </p>
      )}

      {/* Open Tasks Section */}
      {openTasks.length > 0 && (
        <div className="pt-1 border-t border-border/40" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsTasksExpanded(!isTasksExpanded)}
            className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/15 text-violet-600 dark:text-violet-400 text-xs font-medium transition"
          >
            <span className="flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-violet-500" />
              <span>{openTasks.length} {openTasks.length === 1 ? 'tarefa aberta' : 'tarefas abertas'}</span>
            </span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isTasksExpanded && "rotate-180")} />
          </button>

          {isTasksExpanded && (
            <div className="mt-2 space-y-1.5 pl-0.5">
              {openTasks.map(t => (
                <div
                  key={t.id}
                  onClick={() => onOpenTaskDetails?.(t.id)}
                  className="flex items-center justify-between p-2 rounded-xl bg-muted/50 hover:bg-muted text-xs border border-border/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (onToggleTaskStatus) await onToggleTaskStatus(t);
                      }}
                      className="text-muted-foreground hover:text-emerald-500 transition shrink-0 p-0.5"
                    >
                      <Circle className="w-3.5 h-3.5" />
                    </button>
                    <span className="truncate font-medium text-foreground">{t.title}</span>
                  </div>
                  {t.priority !== undefined && t.priority !== 0 && (
                    <span className={cn(
                      "shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2",
                      t.priority > 0
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {t.priority > 0 ? `+${t.priority}` : t.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer controls */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex-1" onClick={handleTimerClick}>
          <TimerControls
            demandId={demand.id}
            operation={demand.operation}
            onStopClick={onStopTimerClick}
            compact={false}
            demandTitle={demand.task || ''}
          />
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onOpenDetails(demand)}
            title="Visualizar Detalhes"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteRequest}
            title="Excluir Demanda"
            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
