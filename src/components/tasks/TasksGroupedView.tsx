'use client';
import { useMemo, useState } from 'react';
import { isBefore, startOfDay } from 'date-fns';
import { ChevronDown, CheckCircle2, Circle, Calendar, Plus, ExternalLink } from 'lucide-react';
import { Demand } from '@/types';
import { Task } from '@/types/index';
import { useDemands } from '@/hooks/useDemands';
import { formatDateShort, formatDateTimeShort, cn } from '@/lib/utils';
import { isEventTask } from '@/services/tasks.service';
import { OperationBadge } from '../demands/OperationBadge';
import { StatusBadge } from '../demands/StatusBadge';
import { RecurrenceBadge } from './RecurrenceBadge';
import { STATUS_BADGE } from './TaskRow';
import { EventBadge, EVENT_ACCENT_CLASSES, EVENT_ROW_CLASSES } from './EventBadge';

interface TasksGroupedViewProps {
  /** Tarefas já filtradas e ordenadas pela página */
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onOpenDemand: (demandId: string) => void;
  onToggleStatus: (task: Task) => Promise<void>;
  /** Abre o modal de criação com a demanda pré-selecionada */
  onAddTask: (demand: Demand) => void;
  showCompletedAt?: boolean;
}

interface TaskGroup {
  demandId: string;
  demand: Demand | null;
  title: string;
  operation: string;
  tasks: Task[];
}

export function TasksGroupedView({
  tasks,
  onOpenTask,
  onOpenDemand,
  onToggleStatus,
  onAddTask,
  showCompletedAt,
}: TasksGroupedViewProps) {
  const { demands } = useDemands();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Agrupa por demanda, seguindo a ordem do quadro de demandas
  const groups = useMemo((): TaskGroup[] => {
    const demandById = new Map(demands.map(d => [d.id, d]));
    const byDemand = new Map<string, TaskGroup>();
    for (const t of tasks) {
      let group = byDemand.get(t.demandId);
      if (!group) {
        const demand = demandById.get(t.demandId) ?? null;
        group = {
          demandId:  t.demandId,
          demand,
          title:     t.demandId ? (demand?.task || t.demandTitle || 'Sem título') : 'Sem demanda vinculada',
          operation: demand?.operation ?? t.operation,
          tasks:     [],
        };
        byDemand.set(t.demandId, group);
      }
      group.tasks.push(t);
    }
    // Itens sem demanda (eventos avulsos) vêm primeiro; demandas apagadas, por último
    const rank = (g: TaskGroup) => (!g.demandId ? -Infinity : g.demand?.order ?? Infinity);
    return [...byDemand.values()].sort((a, b) => rank(a) - rank(b));
  }, [tasks, demands]);

  const toggleGroup = (demandId: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(demandId)) next.delete(demandId);
      else next.add(demandId);
      return next;
    });
  };

  const now   = new Date();
  const today = startOfDay(now);

  return (
    <div className="space-y-3">
      {groups.map(group => {
        const isCollapsed = collapsed.has(group.demandId);
        return (
          <section key={group.demandId} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            {/* Cabeçalho da demanda */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30 border-b border-border/60">
              <button
                onClick={() => toggleGroup(group.demandId)}
                aria-expanded={!isCollapsed}
                title={isCollapsed ? 'Expandir' : 'Recolher'}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                <ChevronDown className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform', isCollapsed && '-rotate-90')} />
                {group.operation && <OperationBadge operation={group.operation} />}
                {group.demand?.demandId && (
                  <span className="font-mono font-bold text-violet-500 text-xs shrink-0">{group.demand.demandId}</span>
                )}
                <span className="text-sm font-semibold text-foreground truncate">{group.title}</span>
                <span className="bg-slate-200 dark:bg-slate-800 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">
                  {group.tasks.length}
                </span>
              </button>

              {group.demand && (
                <StatusBadge status={group.demand.status} className="hidden sm:inline-flex" />
              )}
              {group.demand && !showCompletedAt && (
                <button
                  onClick={() => onAddTask(group.demand!)}
                  title="Nova tarefa nesta demanda"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
              {group.demandId && (
                <button
                  onClick={() => onOpenDemand(group.demandId)}
                  title="Abrir demanda"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Tarefas */}
            {!isCollapsed && (
              <ul className="divide-y divide-border/50">
                {group.tasks.map(task => {
                  const isDone = task.status === 'Concluída' || task.status === 'Cancelado';
                  const badge = STATUS_BADGE[task.status] ?? STATUS_BADGE['Pendente'];
                  const isEvent = isEventTask(task);
                  // Evento vence pelo horário; tarefa, pelo dia
                  const isOverdue = !isDone && !!task.dueDate && isBefore(task.dueDate.toDate(), isEvent ? now : today);
                  const dateValue = showCompletedAt ? task.completedAt : task.dueDate;
                  const priority = task.priority ?? 0;
                  return (
                    <li
                      key={task.id}
                      onClick={() => onOpenTask(task)}
                      className={cn(
                        'flex items-center gap-3 pl-4 pr-3 py-2 transition cursor-pointer group',
                        isEvent ? [EVENT_ROW_CLASSES, EVENT_ACCENT_CLASSES, 'pl-3'] : 'hover:bg-muted/15'
                      )}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleStatus(task); }}
                        title={isDone ? 'Reabrir tarefa' : 'Marcar como concluída'}
                        className={cn(
                          'p-0.5 rounded transition shrink-0',
                          isDone ? 'text-green-500 hover:text-muted-foreground' : 'text-muted-foreground/40 hover:text-green-500'
                        )}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </button>

                      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                        <span className={cn('text-sm font-medium truncate', isDone ? 'line-through text-muted-foreground' : 'text-foreground')}>
                          {task.title || <span className="italic text-muted-foreground">Sem título</span>}
                        </span>
                        {isEvent && <EventBadge />}
                        <RecurrenceBadge recurrence={task.recurrence} />
                        {!isEvent && priority !== 0 && (
                          <span
                            title="Prioridade"
                            className={cn(
                              'px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0',
                              priority > 0
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-muted/70 text-muted-foreground'
                            )}
                          >
                            P{priority}
                          </span>
                        )}
                      </div>

                      <span className={cn('hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0', badge.classes)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', badge.dot)} />
                        {badge.label}
                      </span>

                      <span
                        className={cn(
                          'flex items-center gap-1 text-xs tabular-nums w-24 justify-end shrink-0',
                          isOverdue
                            ? 'text-destructive font-semibold'
                            : isEvent && !showCompletedAt ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-muted-foreground'
                        )}
                        title={showCompletedAt ? 'Finalizada em' : isEvent ? 'Data e hora do evento' : isOverdue ? 'Prazo vencido' : 'Prazo'}
                      >
                        <Calendar className="w-3 h-3 shrink-0" />
                        {dateValue
                          ? (isEvent && !showCompletedAt ? formatDateTimeShort(dateValue) : formatDateShort(dateValue))
                          : '—'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
