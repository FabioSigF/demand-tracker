'use client';
import { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Demand } from '@/types';
import { Task } from '@/types/index';
import { OperationBadge } from './OperationBadge';
import { StatusBadge } from './StatusBadge';
import { DelayedBadge } from './DelayedBadge';
import { TimerControls } from '../timer/TimerControls';
import { GripVertical, Trash2, Calendar, ListTodo, ChevronDown, User, Circle } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import { toast } from 'sonner';
import { useConfirm } from '@/contexts/ConfirmModalContext';

interface DemandRowProps {
  demand: Demand;
  openTasks?: Task[];
  onOpenTaskDetails?: (taskId: string) => void;
  onToggleTaskStatus?: (task: Task) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenDetails: (demand: Demand) => void;
  onStopTimerClick: (seconds: number, stopFn: (finalSeconds: number) => Promise<number>) => void;
  isDragEnabled: boolean;
  showCompletedDate?: boolean;
}

export function DemandRow({
  demand,
  openTasks = [],
  onOpenTaskDetails,
  onToggleTaskStatus,
  onDelete,
  onOpenDetails,
  onStopTimerClick,
  isDragEnabled,
  showCompletedDate
}: DemandRowProps) {
  const { confirm } = useConfirm();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          {demand.requester && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-normal">
              <User className="w-3 h-3 text-muted-foreground/70 shrink-0" />
              <span className="truncate max-w-[180px]">{demand.requester}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <DelayedBadge deadline={demand.deadline} status={demand.status} />
          </div>
        </div>
      </td>

      {/* Open Tasks Dropdown Column */}
      <td className="p-2 w-36 relative" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => {
            if (openTasks.length > 0) {
              setIsDropdownOpen(prev => !prev);
            }
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
            openTasks.length > 0
              ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/20 cursor-pointer shadow-sm'
              : 'bg-muted/30 text-muted-foreground/60 border-border/40 cursor-default'
          }`}
          title={openTasks.length > 0 ? "Clique para ver as tarefas abertas" : "Nenhuma tarefa aberta"}
        >
          <ListTodo className="w-3.5 h-3.5 shrink-0" />
          <span>{openTasks.length} {openTasks.length === 1 ? 'aberta' : 'abertas'}</span>
          {openTasks.length > 0 && (
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          )}
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && openTasks.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div
              ref={dropdownRef}
              className="absolute left-2 top-full mt-1.5 w-80 bg-popover border border-border rounded-xl shadow-2xl z-50 p-3 space-y-2 text-foreground animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <ListTodo className="w-3.5 h-3.5 text-violet-500" />
                  <span>Tarefas Abertas</span>
                  <span className="bg-violet-500/10 text-violet-500 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                    {openTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 divide-y divide-border/30">
                {openTasks.map(t => {
                  const prio = t.priority ?? 0;
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenTaskDetails?.(t.id);
                      }}
                      className="pt-1.5 first:pt-0 flex items-start gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition cursor-pointer group/task"
                    >
                      {onToggleTaskStatus && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTaskStatus(t);
                          }}
                          className="mt-0.5 text-muted-foreground/50 hover:text-green-500 transition shrink-0"
                          title="Concluir tarefa"
                        >
                          <Circle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {prio !== 0 && (
                            <span className={`text-[10px] px-1 py-0.2 rounded font-bold shrink-0 ${
                              prio > 0
                                ? prio >= 3 ? 'bg-rose-500/15 text-rose-500' : prio === 2 ? 'bg-orange-500/15 text-orange-500' : 'bg-sky-500/15 text-sky-500'
                                : 'bg-slate-500/15 text-slate-400'
                            }`}>
                              {prio > 0 ? `+${prio}` : prio}
                            </span>
                          )}
                          <p className="text-xs font-medium text-foreground truncate group-hover/task:text-violet-500 transition">
                            {t.title || 'Sem título'}
                          </p>
                        </div>
                        {t.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {t.description}
                          </p>
                        )}
                      </div>

                      {t.createdAt && (
                        <span className="text-[10px] text-muted-foreground/70 tabular-nums shrink-0 mt-0.5">
                          {formatDateShort(t.createdAt)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
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
          {showCompletedDate ? (
            demand.completedAt ? formatDateShort(demand.completedAt) : <span className="text-muted-foreground">—</span>
          ) : (
            demand.deadline ? formatDateShort(demand.deadline) : <span className="text-muted-foreground">—</span>
          )}
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
          demandTitle={demand.task || ''}
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