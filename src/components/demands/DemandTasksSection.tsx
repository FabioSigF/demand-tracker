'use client';
import { useState, useCallback } from 'react';
import { createTask } from '@/services/tasks.service';
import { Task } from '@/types/index';
import { Demand } from '@/types';
import { useConfirm } from '@/contexts/ConfirmModalContext';
import {
  CheckCircle2, Circle, Trash2, Plus, ChevronDown,
  ChevronUp, ListTodo, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface DemandTasksSectionProps {
  demand: Demand;
  // Tasks recebidas do DemandDrawer (fonte única via useTasksByDemand)
  tasks: Task[];
  pendingTasks: Task[];
  completedTasks: Task[];
  loading: boolean;
  onEditTask: (id: string, data: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  onRemoveTask: (id: string) => Promise<void>;
  onOpenTask: (task: Task) => void;
}

export function DemandTasksSection({
  demand,
  pendingTasks,
  completedTasks,
  loading,
  onEditTask,
  onRemoveTask,
  onOpenTask,
}: DemandTasksSectionProps) {
  const { user } = useAuthContext();
  const { confirm } = useConfirm();

  const [showCompleted, setShowCompleted] = useState(false);
  const [isCreating,    setIsCreating]    = useState(false);
  const [newTitle,      setNewTitle]      = useState('');
  const [newDesc,       setNewDesc]       = useState('');
  const [newPriority,   setNewPriority]   = useState<number>(0);
  const [saving,        setSaving]        = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim()) { toast.error('Informe um título para a tarefa'); return; }
    if (!user) return;
    setSaving(true);
    try {
      await createTask({
        userId:      user.uid,
        demandId:    demand.id,
        demandTitle: demand.task || '',
        operation:   demand.operation,
        title:       newTitle.trim(),
        description: newDesc.trim(),
        priority:    newPriority,
      });
      toast.success('Tarefa criada');
      setNewTitle('');
      setNewDesc('');
      setNewPriority(0);
      setIsCreating(false);
    } catch {
      toast.error('Erro ao criar tarefa');
    } finally {
      setSaving(false);
    }
  };

  // Toggle: Pendente ↔ Concluída (atalho rápido no checkbox)
  const handleToggle = useCallback(async (task: Task) => {
    const newStatus = task.status === 'Concluída' ? 'Pendente' : 'Concluída';
    try {
      await onEditTask(task.id, { status: newStatus });
      toast.success(newStatus === 'Concluída' ? 'Tarefa concluída' : 'Tarefa reaberta');
    } catch {
      toast.error('Erro ao atualizar tarefa');
    }
  }, [onEditTask]);

  const handleDelete = useCallback(async (task: Task) => {
    const confirmed = await confirm({
      title: 'Excluir tarefa',
      description: 'Esta ação não poderá ser desfeita.',
      confirmText: 'Excluir',
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await onRemoveTask(task.id);
      toast.success('Tarefa excluída');
    } catch {
      toast.error('Erro ao excluir tarefa');
    }
  }, [confirm, onRemoveTask]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <ListTodo className="w-4 h-4" />
          Tarefas
          {!loading && (
            <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full font-normal ml-1">
              {pendingTasks.length} em atendimento
            </span>
          )}
        </label>
        <button
          onClick={() => setIsCreating(v => !v)}
          className="flex items-center gap-1 text-xs font-semibold text-violet-500 hover:text-violet-400 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova tarefa
        </button>
      </div>

      {/* Formulário inline */}
      {isCreating && (
        <div className="bg-muted/20 border border-border/60 rounded-xl p-3 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setIsCreating(false); setNewTitle(''); setNewDesc(''); setNewPriority(0); }
              }}
              placeholder="Título da tarefa..."
              autoFocus
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
            <div className="flex items-center gap-1 shrink-0" title="Prioridade (padrão: 0)">
              <span className="text-[10px] text-muted-foreground font-bold">P:</span>
              <input
                type="number"
                value={newPriority}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  setNewPriority(isNaN(val) ? 0 : val);
                }}
                className="w-14 bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground font-bold text-center"
              />
            </div>
          </div>
          <textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Descrição (opcional)..."
            rows={2}
            className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => { setIsCreating(false); setNewTitle(''); setNewDesc(''); }}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !newTitle.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Criar
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-4 text-muted-foreground text-xs gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Carregando tarefas...
        </div>
      )}

      {/* Tarefas em atendimento */}
      {!loading && (
        <div className="space-y-1">
          {pendingTasks.length === 0 && !isCreating && (
            <p className="text-xs text-muted-foreground italic py-2">Nenhuma tarefa em atendimento.</p>
          )}
          {pendingTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onOpen={onOpenTask}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Tarefas finalizadas — colapsável */}
      {!loading && completedTasks.length > 0 && (
        <div className="space-y-1">
          <button
            onClick={() => setShowCompleted(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition w-full text-left py-1"
          >
            {showCompleted ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Finalizadas ({completedTasks.length})
          </button>
          {showCompleted && completedTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onOpen={onOpenTask}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Item individual ───────────────────────────────────────────────────────────

interface TaskItemProps {
  task: Task;
  onOpen: (task: Task) => void;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function TaskItem({ task, onOpen, onToggle, onDelete }: TaskItemProps) {
  const isDone = task.status === 'Concluída' || task.status === 'Cancelado';

  return (
    <div className="flex items-start gap-2 group/item px-2 py-1.5 rounded-lg hover:bg-muted/30 transition">
      <button
        onClick={() => onToggle(task)}
        title={isDone ? 'Reabrir tarefa' : 'Marcar como concluída'}
        className={`mt-0.5 shrink-0 transition ${
          isDone ? 'text-green-500 hover:text-muted-foreground' : 'text-muted-foreground/40 hover:text-green-500'
        }`}
      >
        {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
      </button>

      <button
        onClick={() => onOpen(task)}
        className={`flex-1 text-left text-sm leading-snug transition flex items-start justify-between gap-2 ${
          isDone ? 'line-through text-muted-foreground' : 'text-foreground hover:text-primary'
        }`}
      >
        <div className="flex-1 min-w-0">
          <span>{task.title || <span className="italic text-muted-foreground">Sem título</span>}</span>
          {task.description && (
            <span
              className="block text-xs text-muted-foreground font-normal mt-0.5 line-clamp-1"
              style={{ textDecoration: 'none' }}
            >
              {task.description}
            </span>
          )}
        </div>
        {task.priority !== undefined && task.priority !== 0 && (
          <span className={cn(
            "shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            task.priority > 0
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              : "bg-muted text-muted-foreground"
          )}>
            {task.priority > 0 ? `+${task.priority}` : task.priority}
          </span>
        )}
      </button>

      <button
        onClick={() => onDelete(task)}
        className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition opacity-0 group-hover/item:opacity-100"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}