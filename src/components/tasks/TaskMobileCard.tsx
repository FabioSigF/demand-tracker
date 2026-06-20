'use client';
import { Task, TaskStatus } from '@/types/index';
import { OperationBadge } from '../demands/OperationBadge';
import { Trash2, Calendar, Eye, CheckCircle2, Circle } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfirm } from '@/contexts/ConfirmModalContext';

const STATUS_BADGE: Record<TaskStatus, { label: string; classes: string; dot: string }> = {
  'Pendente': { label: 'Pendente', classes: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  'Em andamento': { label: 'Em andamento', classes: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  'Cancelado': { label: 'Cancelado', classes: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  'Concluída': { label: 'Concluída', classes: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', dot: 'bg-green-500' },
};

interface TaskMobileCardProps {
  task: Task;
  onDelete: (id: string) => Promise<void>;
  onOpenDetails: (task: Task) => void;
  onOpenDemand: (demandId: string) => void;
  onToggleStatus: (task: Task) => Promise<void>;
  showCompletedAt?: boolean;
}

export function TaskMobileCard({
  task,
  onDelete,
  onOpenDetails,
  onOpenDemand,
  onToggleStatus,
  showCompletedAt
}: TaskMobileCardProps) {
  const { confirm } = useConfirm();
  const isDone = task.status === 'Concluída' || task.status === 'Cancelado';
  const badge = STATUS_BADGE[task.status] ?? STATUS_BADGE['Pendente'];

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
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDemandBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenDemand(task.demandId);
  };

  return (
    <div
      onClick={() => onOpenDetails(task)}
      className="bg-card border border-border/80 rounded-2xl p-4 space-y-3.5 shadow-sm hover:border-violet-500/30 transition duration-150 active:scale-[0.99] cursor-pointer"
    >
      {/* Top row: Checkbox status, operation badge and status badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            title={isDone ? 'Reabrir tarefa' : 'Marcar como concluída'}
            className={`p-1.5 rounded transition shrink-0 ${
              isDone ? 'text-green-500 hover:text-muted-foreground' : 'text-muted-foreground/40 hover:text-green-500'
            }`}
          >
            {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
          </button>
          <OperationBadge operation={task.operation} className="text-[10px] px-1.5 py-0" />
        </div>

        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.classes}`}>
          <span className={`w-1 h-1 rounded-full shrink-0 ${badge.dot}`} />
          {badge.label}
        </span>
      </div>

      {/* Task and Demand title */}
      <div className="space-y-1">
        <button
          onClick={handleDemandBadgeClick}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 hover:bg-muted border border-border/50 text-[10px] font-medium text-muted-foreground hover:text-foreground transition max-w-[200px]"
          title={`Abrir demanda: ${task.demandTitle}`}
        >
          <span className="truncate">{task.demandTitle || 'Demanda sem título'}</span>
        </button>

        <h4 className={`font-semibold text-sm leading-snug ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title || <span className="text-muted-foreground italic">Sem título</span>}
        </h4>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/30 p-2 rounded-lg">
          {task.description}
        </p>
      )}

      {/* Dates Block */}
      <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-2 tabular-nums">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-[10px]">Criada:</span>
          <span className="text-foreground font-semibold">
            {task.createdAt ? formatDateShort(task.createdAt) : '—'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground justify-end">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-[10px]">{showCompletedAt ? 'Fim:' : 'Prazo:'}</span>
          <span className="text-foreground font-semibold">
            {showCompletedAt ? (
              task.completedAt ? formatDateShort(task.completedAt) : '—'
            ) : (
              task.dueDate ? formatDateShort(task.dueDate) : '—'
            )}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-1 border-t border-border/40 pt-2 shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onOpenDetails(task)}
          title="Visualizar Detalhes"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={handleDeleteRequest}
          title="Excluir Tarefa"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
