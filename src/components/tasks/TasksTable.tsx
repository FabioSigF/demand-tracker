'use client';
import { useState, useMemo, useCallback } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useDemand } from '@/hooks/useDemand';
import { TaskRow } from './TaskRow';
import { TaskDrawer } from './TaskDrawer';
import { CreateTaskModal } from './CreateTaskModal';
import { DemandDrawer } from '../demands/DemandDrawer';
import { Task } from '@/types/index';
import { Search, X, CheckCircle, Clock, Plus, ListTodo } from 'lucide-react';
import { toast } from 'sonner';

export function TasksTable() {
  const { tasks, activeTasks, doneTasks, loading, editTask, removeTask } = useTasks();

  const [activeTab, setActiveTab] = useState<'active' | 'done'>('active');
  const [search,    setSearch]    = useState('');

  // ── CreateTaskModal ───────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // ── TaskDrawer ────────────────────────────────────────────────────────────
  const [selectedTaskId,   setSelectedTaskId]   = useState<string | null>(null);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);

  const selectedTask = useMemo(
    () => tasks.find(t => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const handleCloseTaskDrawer = useCallback(async () => {
    setIsTaskDrawerOpen(false);
    await new Promise(r => setTimeout(r, 100));
    setSelectedTaskId(null);
  }, []);

  // ── DemandDrawer — lazy ───────────────────────────────────────────────────
  const [selectedDemandId,   setSelectedDemandId]   = useState<string | null>(null);
  const [isDemandDrawerOpen, setIsDemandDrawerOpen] = useState(false);

  const { demand: selectedDemand, editDemand } = useDemand(
    isDemandDrawerOpen ? selectedDemandId : null
  );

  const handleOpenDemand = useCallback((demandId: string) => {
    setSelectedDemandId(demandId);
    setIsDemandDrawerOpen(true);
  }, []);

  const handleCloseDemandDrawer = useCallback(async () => {
    setIsDemandDrawerOpen(false);
    await new Promise(r => setTimeout(r, 100));
    setSelectedDemandId(null);
  }, []);

  // ── Toggle status — Pendente ↔ Concluída (atalho rápido da linha) ─────────
  // Para os outros status (Em andamento, Cancelado) o usuário abre o drawer.
  const handleToggleStatus = useCallback(async (task: Task) => {
    const newStatus = task.status === 'Concluída' ? 'Pendente' : 'Concluída';
    try {
      await editTask(task.id, { status: newStatus });
      toast.success(newStatus === 'Concluída' ? 'Tarefa concluída' : 'Tarefa reaberta');
    } catch {
      toast.error('Erro ao atualizar status');
    }
  }, [editTask]);

  // ── Listas filtradas ──────────────────────────────────────────────────────
  const currentList = activeTab === 'active' ? activeTasks : doneTasks;

  const filteredTasks = useMemo(() => {
    if (!search.trim()) return currentList;
    const s = search.toLowerCase();
    return currentList.filter(t =>
      t.title.toLowerCase().includes(s) ||
      t.description.toLowerCase().includes(s) ||
      t.demandId.toLowerCase().includes(s) ||
      t.demandTitle.toLowerCase().includes(s) ||
      t.operation.toLowerCase().includes(s)
    );
  }, [currentList, search]);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-background/50">

      {/* Upper bar */}
      <div className="flex items-center justify-between border-b border-border bg-card/40 px-6 py-2 shrink-0">
        <div className="flex items-center gap-2">
          {/* Em Atendimento = Pendente + Em andamento */}
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'active'
                ? 'bg-violet-600/10 text-violet-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="w-4 h-4" />
            Em Atendimento
            <span className="bg-slate-200 dark:bg-slate-800 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full">
              {activeTasks.length}
            </span>
          </button>

          {/* Finalizadas = Concluída + Cancelado */}
          <button
            onClick={() => setActiveTab('done')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'done'
                ? 'bg-violet-600/10 text-violet-500'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Finalizadas
            <span className="bg-slate-200 dark:bg-slate-800 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full">
              {doneTasks.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2 rounded-xl transition shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {/* Search bar */}
      <div className="px-6 pt-4 shrink-0">
        <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl mb-4 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por título, demanda, operação..."
              className="w-full bg-muted/40 hover:bg-muted focus:bg-background border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg border border-border/80 transition"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6 min-h-0">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-left table-fixed min-w-[1100px]">
              <thead className="bg-muted/30 border-b border-border sticky top-0 z-10 select-none">
                <tr className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  <th className="p-2 w-10"></th>
                  <th className="p-2 w-36">Operação</th>
                  <th className="p-2 min-w-[200px]">Tarefa</th>
                  <th className="p-2 min-w-[350px]">Descrição</th>
                  <th className="p-2 w-36">Status</th>
                  <th className="p-2 w-24">Prazo</th>
                  <th className="p-2 w-24">Criado em</th>
                  <th className="p-2 w-12"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Carregando tarefas...
                    </td>
                  </tr>
                ) : filteredTasks.length > 0 ? (
                  filteredTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onDelete={removeTask}
                      onOpenDetails={(t) => {
                        setSelectedTaskId(t.id);
                        setIsTaskDrawerOpen(true);
                      }}
                      onOpenDemand={handleOpenDemand}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center">
                          <ListTodo className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {search
                              ? 'Nenhuma tarefa encontrada'
                              : activeTab === 'active'
                                ? 'Nenhuma tarefa em atendimento hoje'
                                : 'Nenhuma tarefa finalizada hoje'}
                          </p>
                          <p className="text-xs text-muted-foreground max-w-xs">
                            {search
                              ? 'Tente ajustar os termos da busca.'
                              : 'Tarefas criadas hoje, com prazo para hoje ou finalizadas hoje aparecem aqui.'}
                          </p>
                        </div>
                        {!search && activeTab === 'active' && (
                          <button
                            onClick={() => setIsCreateOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition shadow-lg shadow-violet-500/20"
                          >
                            <Plus className="w-4 h-4" />
                            Nova Tarefa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modais e Drawers */}
      <CreateTaskModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <TaskDrawer
        isOpen={isTaskDrawerOpen}
        onClose={handleCloseTaskDrawer}
        task={selectedTask}
        onUpdate={editTask}
        onOpenDemand={async (demandId) => {
          await handleCloseTaskDrawer();
          handleOpenDemand(demandId);
        }}
      />

      <DemandDrawer
        isOpen={isDemandDrawerOpen}
        onClose={handleCloseDemandDrawer}
        demand={selectedDemand}
        onUpdate={editDemand}
      />
    </div>
  );
}