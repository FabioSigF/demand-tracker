'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Demand } from '@/types';
import { OperationBadge } from './OperationBadge';
import { StatusBadge } from './StatusBadge';
import { DelayedBadge } from './DelayedBadge';
import { TimerControls } from '../timer/TimerControls';
import { GripVertical, Trash2, Calendar } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfirm } from '@/contexts/ConfirmModalContext';

interface DemandRowProps {
  demand: Demand;
  onDelete: (id: string) => Promise<void>;
  onOpenDetails: (demand: Demand) => void;
  onStopTimerClick: (seconds: number, stopFn: (finalSeconds: number) => Promise<number>) => void;
  isDragEnabled: boolean;
}

export function DemandRow({
  demand,
  onDelete,
  onOpenDetails,
  onStopTimerClick,
  isDragEnabled,
}: DemandRowProps) {
  const { confirm } = useConfirm();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: demand.id, disabled: !isDragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : 'auto',
  };

  const handleDeleteRequest = async (e: React.MouseEvent) => {
    e.stopPropagation(); // impede abrir o drawer ao excluir
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
    e.stopPropagation(); // impede abrir o drawer ao interagir com o timer
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      onClick={() => onOpenDetails(demand)}
      className="border-b border-border/60 hover:bg-muted/15 transition-all text-sm group cursor-pointer"
    >
      {/* Drag Handle */}
      <td className="p-2 w-8 text-center" onClick={e => e.stopPropagation()}>
        {isDragEnabled ? (
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing hover:bg-muted transition shrink-0"
            title="Arrastar para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-6" />
        )}
      </td>

      {/* ID */}
      <td className="p-2 w-20">
        <span className="font-mono font-bold text-violet-500 text-xs">
          {demand.demandId || '—'}
        </span>
      </td>

      {/* Operation */}
      <td className="p-2 w-36">
        <OperationBadge operation={demand.operation} />
      </td>

      {/* Task */}
      <td className="p-2 min-w-[180px]">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-foreground truncate block max-w-xs">
            {demand.task || <span className="text-muted-foreground italic">Sem título</span>}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <DelayedBadge deadline={demand.deadline} status={demand.status} />
          </div>
        </div>
      </td>

      {/* Start Date */}
      <td className="p-2 w-24">
        <div className="flex items-center gap-1 text-xs text-foreground font-semibold tabular-nums">
          <Calendar className="w-3 h-3 text-muted-foreground/60 shrink-0" />
          {demand.startDate ? formatDateShort(demand.startDate) : <span className="text-muted-foreground">—</span>}
        </div>
      </td>

      {/* Deadline */}
      <td className="p-2 w-24">
        <div className="flex items-center gap-1 text-xs text-foreground font-semibold tabular-nums">
          <Calendar className="w-3 h-3 text-muted-foreground/60 shrink-0" />
          {demand.deadline ? formatDateShort(demand.deadline) : <span className="text-muted-foreground">—</span>}
        </div>
      </td>

      {/* Status */}
      <td className="p-2 w-36">
        <StatusBadge status={demand.status} />
      </td>

      {/* Quick Notes — agora com mais espaço */}
      <td className="p-2">
        <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {demand.notes || <span className="italic">—</span>}
        </span>
      </td>

      {/* Timer — compacto, não propaga clique */}
      <td className="p-2 w-32 shrink-0" onClick={handleTimerClick}>
        <TimerControls
          demandId={demand.id}
          operation={demand.operation}
          onStopClick={onStopTimerClick}
          compact
        />
      </td>

      {/* Actions */}
      <td className="p-2 w-12 text-right" onClick={e => e.stopPropagation()}>
        <button
          onClick={handleDeleteRequest}
          title="Excluir demanda"
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}