'use client';
import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTasks } from '@/hooks/useTasks';
import { useDemand } from '@/hooks/useDemand';
import { TaskRow } from './TaskRow';
import { TaskMobileCard } from './TaskMobileCard';
import { TaskDrawer } from './TaskDrawer';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskFilters, TaskFilterState } from './TaskFilters';
import { DemandDrawer } from '../demands/DemandDrawer';
import { Task } from '@/types/index';
import { CheckCircle, Clock, Plus, ListTodo, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, subDays, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TasksTable() {
  const {
    tasks,
    activeTasks,
    doneTasks,
    loadingActive,
    loadingDone,
    doneDate,
    setDoneDate,
    editTask,
    removeTask,
    reorder,
  } = useTasks();

  const [activeTab, setActiveTab] = useState<'active' | 'done'>('active');

  // ── Filtros unificados ────────────────────────────────────────────────────
  const [filters, setFilters] = useState<TaskFilterState>({
    search:    '',
    operation: 'Todos',
  });

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

  // ── Toggle status ─────────────────────────────────────────────────────────
  const handleToggleStatus = useCallback(async (task: Task) => {
    const newStatus = task.status === 'Concluída' ? 'Pendente' : 'Concluída';
    try {
      await editTask(task.id, { status: newStatus });
      toast.success(newStatus === 'Concluída' ? 'Tarefa concluída' : 'Tarefa reaberta');
    } catch {
      toast.error('Erro ao atualizar status');
    }
  }, [editTask]);

  // ── Drag-and-drop ─────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activeTasks.findIndex(t => t.id === active.id);
    const newIndex  = activeTasks.findIndex(t => t.id === over.id);
    const reordered = arrayMove(activeTasks, oldIndex, newIndex);
    const updates   = reordered.map((t, i) => ({ id: t.id, order: (i + 1) * 1000 }));
    try { await reorder(updates); }
    catch { toast.error('Erro ao reordenar tarefas'); }
  };

  // Drag desabilitado na aba Finalizadas e com filtros ativos
  const isDragEnabled =
    activeTab === 'active' &&
    !filters.search.trim() &&
    filters.operation === 'Todos' &&
    !filters.startDate &&
    !filters.endDate;

  // ── Filtragem client-side ─────────────────────────────────────────────────
  // As queries do Firestore já separam ativo/finalizado e filtram por data
  // de completedAt (finalizadas) ou retornam tudo (ativas).
  // Aqui aplicamos busca textual, operação e — para a aba ativa —
  // filtro de datas por createdAt/dueDate.
  const currentList = activeTab === 'active' ? activeTasks : doneTasks;

  const filteredTasks = useMemo(() => {
    return currentList.filter(t => {
      // Busca textual
      if (filters.search.trim()) {
        const s = filters.search.toLowerCase();
        const match =
          t.title.toLowerCase().includes(s) ||
          t.description.toLowerCase().includes(s) ||
          t.demandId.toLowerCase().includes(s) ||
          t.demandTitle.toLowerCase().includes(s) ||
          t.operation.toLowerCase().includes(s);
        if (!match) return false;
      }

      // Operação
      if (filters.operation !== 'Todos' && t.operation !== filters.operation) return false;

      // Filtro de data por createdAt (aplicado em ambas as abas para
      // refinamento adicional; nas finalizadas, a query já filtrou por
      // completedAt, mas o usuário pode querer ver por data de criação)
      if (filters.startDate) {
        const from = new Date(filters.startDate + 'T00:00:00').getTime();
        const ts   = t.createdAt?.toDate().getTime() ?? 0;
        if (ts < from) return false;
      }
      if (filters.endDate) {
        const to = new Date(filters.endDate + 'T23:59:59').getTime();
        const ts  = t.createdAt?.toDate().getTime() ?? 0;
        if (ts > to) return false;
      }

      return true;
    });
  }, [currentList, filters]);

  const loading = activeTab === 'active' ? loadingActive : loadingDone;

  // ── Navegação de data (aba Finalizadas) ───────────────────────────────────
  const doneDateLabel = isToday(doneDate)
    ? 'Hoje'
    : format(doneDate, "dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-background/50">

      {/* Upper bar */}
      <div className="flex items-center justify-between border-b border-border bg-card/40 px-6 py-2 shrink-0">
        <div className="flex items-center gap-2">
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

      {/* Filtros + navegador de data */}
      <div className="px-6 pt-4 shrink-0">
        <TaskFilters filters={filters} onChange={setFilters} />

        {/* Navegador de data — só na aba Finalizadas */}
        {activeTab === 'done' && (
          <div className="flex items-center gap-1 mb-4 -mt-2">
            <button
              onClick={() => setDoneDate(d => subDays(d, 1))}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
              title="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 border border-border rounded-lg text-sm font-medium text-foreground min-w-[130px] justify-center">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>{doneDateLabel}</span>
            </div>

            <button
              onClick={() => setDoneDate(d => addDays(d, 1))}
              disabled={isToday(doneDate)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-30 disabled:cursor-not-allowed"
              title="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday(doneDate) && (
              <button
                onClick={() => setDoneDate(new Date())}
                className="px-2.5 py-1.5 text-xs font-semibold text-violet-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition"
              >
                Hoje
              </button>
            )}

            {/* Seleção direta por calendário */}
            <div className="relative">
              <input
                type="date"
                value={format(doneDate, 'yyyy-MM-dd')}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) setDoneDate(new Date(e.target.value + 'T12:00:00'));
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Selecionar data"
              />
              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition">
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table & Mobile view */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 min-h-0">
        {/* Desktop View */}
        <div className="hidden lg:flex bg-card border border-border rounded-xl shadow-sm overflow-hidden h-full flex-col">
          <div className="flex-1 overflow-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full border-collapse text-left table-fixed min-w-[1100px]">
                <thead className="bg-muted border-b border-border sticky top-0 z-10 select-none">
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    <th className="p-2 w-8"></th>
                    <th className="p-2 w-10"></th>
                    <th className="p-2 w-36">Operação</th>
                    <th className="p-2 min-w-[200px]">Tarefa</th>
                    <th className="p-2 min-w-[350px]">Descrição</th>
                    <th className="p-2 w-36">Status</th>
                    <th className="p-2 w-24">
                      {activeTab === 'done' ? 'Finalizada' : 'Prazo'}
                    </th>
                    <th className="p-2 w-24">Criado em</th>
                    <th className="p-2 w-12"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        Carregando tarefas...
                      </td>
                    </tr>
                  ) : filteredTasks.length > 0 ? (
                    <SortableContext
                      items={filteredTasks.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {filteredTasks.map(task => (
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
                          isDragEnabled={isDragEnabled}
                          showCompletedAt={activeTab === 'done'}
                        />
                      ))}
                    </SortableContext>
                  ) : (
                    <tr>
                      <td colSpan={9}>
                        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center">
                            <ListTodo className="w-6 h-6 text-muted-foreground/40" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {filters.search || filters.operation !== 'Todos' || filters.startDate || filters.endDate
                                ? 'Nenhuma tarefa encontrada para esses filtros'
                                : activeTab === 'active'
                                  ? 'Nenhuma tarefa em atendimento'
                                  : `Nenhuma tarefa finalizada em ${doneDateLabel.toLowerCase()}`}
                            </p>
                            <p className="text-xs text-muted-foreground max-w-xs">
                              {filters.search || filters.operation !== 'Todos' || filters.startDate || filters.endDate
                                ? 'Tente ajustar os filtros.'
                                : activeTab === 'active'
                                  ? 'Crie uma nova tarefa para começar.'
                                  : 'Navegue entre os dias para ver outras tarefas finalizadas.'}
                            </p>
                          </div>
                          {!filters.search && filters.operation === 'Todos' && !filters.startDate && !filters.endDate && activeTab === 'active' && (
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
            </DndContext>
          </div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4 pb-20">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">
              Carregando tarefas...
            </div>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <TaskMobileCard
                key={task.id}
                task={task}
                onDelete={removeTask}
                onOpenDetails={(t) => {
                  setSelectedTaskId(t.id);
                  setIsTaskDrawerOpen(true);
                }}
                onOpenDemand={handleOpenDemand}
                onToggleStatus={handleToggleStatus}
                showCompletedAt={activeTab === 'done'}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center bg-card border border-border rounded-xl p-6">
              <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Nenhuma tarefa encontrada
                </p>
                <p className="text-xs text-muted-foreground">
                  {filters.search || filters.operation !== 'Todos' || filters.startDate || filters.endDate
                    ? 'Ajuste os filtros de pesquisa.'
                    : activeTab === 'active'
                      ? 'Crie uma nova tarefa para começar.'
                      : `Nenhuma tarefa concluída em ${doneDateLabel.toLowerCase()}.`}
                </p>
              </div>
              {!filters.search && filters.operation === 'Todos' && !filters.startDate && !filters.endDate && activeTab === 'active' && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition"
                >
                  <Plus className="w-4 h-4" />
                  Nova Tarefa
                </button>
              )}
            </div>
          )}
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