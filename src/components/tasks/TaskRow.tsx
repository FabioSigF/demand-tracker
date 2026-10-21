'use client';
import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus } from '@/types/index';
import { OperationBadge } from '../demands/OperationBadge';
import { GripVertical, Trash2, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { formatDateShort, formatDateTimeShort, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfirm } from '@/contexts/ConfirmModalContext';

const STATUS_BADGE: Record<TaskStatus, { label: string; classes: string; dot: string }> = {
  'Pendente': { label: 'Pendente', classes: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  'Em andamento': { label: 'Em andamento', classes: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  'Cancelado': { label: 'Cancelado', classes: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  'Concluída': { label: 'Concluída', classes: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', dot: 'bg-green-500' },
};

interface TaskRowProps {
  task: Task;
  onDelete: (id: string) => Promise<void>;
  onOpenDetails: (task: Task) => void;
  onOpenDemand: (demandId: string) => void;
  onToggleStatus: (task: Task) => Promise<void>;
  onUpdatePriority?: (task: Task, newPriority: number) => Promise<void>;
  isDragEnabled: boolean;
  showCompletedAt?: boolean;
}

export function TaskRow({
  task,
  onDelete,
  onOpenDetails,
  onOpenDemand,
  onToggleStatus,
  onUpdatePriority,
  isDragEnabled,
  showCompletedAt
}: TaskRowProps) {
  const { confirm } = useConfirm();
  const isDone = task.status === 'Concluída' || task.status === 'Cancelado';
  const badge = STATUS_BADGE[task.status] ?? STATUS_BADGE['Pendente'];

  const [priorityVal, setPriorityVal] = useState<number | string>(task.priority ?? 0);

  useEffect(() => {
    setPriorityVal(task.priority ?? 0);
  }, [task.priority]);

  const handlePriorityCommit = async (val: number) => {
    setPriorityVal(val);
    if (val === (task.priority ?? 0)) return;
    try {
      if (onUpdatePriority) {
        await onUpdatePriority(task, val);
      }
    } catch {
      toast.error('Erro ao atualizar prioridade');
    }
  };

  // ── Drag-and-drop — mesmo padrão do DemandRow ─────────────────────────────
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !isDragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : 'auto',
  };

  const handleDeleteRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Excluir tarefa',
      description: 'Esta ação não poderá ser desfeita. Deseja realmente excluir esta tarefa?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await onDelete(task.id);
      toast.success('Tarefa excluída');
    } catch {
      toast.error('Erro ao excluir tarefa');
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onToggleStatus(task);
      toast.success(isDone ? 'Tarefa reaberta' : 'Tarefa concluída');
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDemandBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenDemand(task.demandId);
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      onClick={() => onOpenDetails(task)}
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

      {/* Toggle status */}
      <td className="p-2 w-10 text-center" onClick={e => e.stopPropagation()}>
        <button
          onClick={handleToggle}
          title={isDone ? 'Reabrir tarefa' : 'Marcar como concluída'}
          className={`p-1 rounded transition shrink-0 ${isDone
              ? 'text-green-500 hover:text-muted-foreground'
              : 'text-muted-foreground/40 hover:text-green-500'
            }`}
        >
          {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
        </button>
      </td>

      {/* Prioridade */}
      <td className="p-2 w-28" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handlePriorityCommit(Number(priorityVal) - 1)}
            className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-bold transition shrink-0"
            title="Diminuir prioridade"
          >
            -
          </button>
          <input
            type="number"
            value={priorityVal}
            onChange={e => setPriorityVal(e.target.value)}
            onBlur={() => {
              const num = parseInt(String(priorityVal), 10);
              if (!isNaN(num)) {
                handlePriorityCommit(num);
              } else {
                setPriorityVal(task.priority ?? 0);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
            className={cn(
              "w-12 px-1 py-0.5 text-xs text-center font-bold rounded-lg border transition focus:outline-none focus:ring-1 focus:ring-violet-500",
              Number(priorityVal) > 0
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : Number(priorityVal) < 0
                  ? "bg-muted/70 text-muted-foreground border-border/40"
                  : "bg-muted/30 text-foreground border-border/50"
            )}
            title="Prioridade (ex: -1, 0, 1, 2, 3...)"
          />
          <button
            type="button"
            onClick={() => handlePriorityCommit(Number(priorityVal) + 1)}
            className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-bold transition shrink-0"
            title="Aumentar prioridade"
          >
            +
          </button>
        </div>
      </td>

      {/* Operation */}
      <td className="p-2 w-36">
        <OperationBadge operation={task.operation} />
      </td>

      {/* Tarefa + badge da demanda */}
      <td className="p-2 min-w-[200px]">
        <div className="flex flex-col gap-1">
          <button
            onClick={handleDemandBadgeClick}
            className="self-start flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 hover:bg-muted border border-border/50 hover:border-border text-[10px] font-medium text-muted-foreground hover:text-foreground transition max-w-[200px]"
            title={`Abrir demanda: ${task.demandTitle}`}
          >
            <span className="truncate">{task.demandTitle || 'Sem título'}</span>
          </button>
          <span className={`font-medium truncate block max-w-xs ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}>
            {task.title || <span className="italic text-muted-foreground">Sem título</span>}
          </span>
        </div>
      </td>

      {/* Descrição */}
      <td className="p-2 min-w-[350px]">
        <span className={`text-xs leading-relaxed line-clamp-2 ${isDone ? 'text-muted-foreground/60' : 'text-muted-foreground'
          }`}>
          {task.description || <span className="italic">—</span>}
        </span>
      </td>

      {/* Status */}
      <td className="p-2 w-36">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${badge.classes}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
          {badge.label}
        </span>
      </td>

      {/* Due Date */}
      <td className="p-2 w-24">
        {showCompletedAt ? (
          task.completedAt ? (
            <div className="flex items-center gap-1 text-xs text-foreground font-semibold tabular-nums">
              <Calendar className="w-3 h-3 text-muted-foreground/60 shrink-0" />
              {formatDateShort(task.completedAt)}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )
        ) : task.dueDate ? (
          <div className="flex items-center gap-1 text-xs text-foreground font-semibold tabular-nums">
            <Calendar className="w-3 h-3 text-muted-foreground/60 shrink-0" />
            {formatDateShort(task.dueDate)}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>

      {/* Created At */}
      <td className="p-2 w-28">
        <div className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <Calendar className="w-3 h-3 text-muted-foreground/60 shrink-0" />
          <span>{formatDateTimeShort(task.createdAt)}</span>
        </div>
      </td>

      {/* Actions */}
      <td className="p-2 w-12 text-right" onClick={e => e.stopPropagation()}>
        <button
          onClick={handleDeleteRequest}
          title="Excluir tarefa"
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}