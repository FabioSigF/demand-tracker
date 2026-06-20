'use client';
import { Demand } from '@/types';
import { OperationBadge } from './OperationBadge';
import { StatusBadge } from './StatusBadge';
import { DelayedBadge } from './DelayedBadge';
import { TimerControls } from '../timer/TimerControls';
import { Trash2, Calendar, Eye } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfirm } from '@/contexts/ConfirmModalContext';

interface DemandMobileCardProps {
  demand: Demand;
  onDelete: (id: string) => Promise<void>;
  onOpenDetails: (demand: Demand) => void;
  onStopTimerClick: (seconds: number, stopFn: (finalSeconds: number) => Promise<number>) => void;
  showCompletedDate?: boolean;
}

export function DemandMobileCard({
  demand,
  onDelete,
  onOpenDetails,
  onStopTimerClick,
  showCompletedDate
}: DemandMobileCardProps) {
  const { confirm } = useConfirm();

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

      {/* Demand Title */}
      <div className="space-y-1">
        <h4 className="font-semibold text-foreground text-sm leading-snug">
          {demand.task || <span className="text-muted-foreground italic">Sem título</span>}
        </h4>
        <div className="flex flex-wrap items-center gap-1.5">
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
