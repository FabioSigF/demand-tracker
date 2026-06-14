'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  subscribeToActiveTasks,
  subscribeToDoneTasks,
  subscribeToTasksByDemand,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  CreateTaskInput,
} from '@/services/tasks.service';
import { Task } from '@/types/index';

const ACTIVE_TASK_STATUSES = ['Pendente', 'Em andamento'];
const DONE_TASK_STATUSES   = ['Concluída', 'Cancelado'];

// ── Hook principal: página de Tarefas ────────────────────────────────────────
export function useTasks() {
  const { user } = useAuthContext();

  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [doneTasks,   setDoneTasks]   = useState<Task[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingDone,   setLoadingDone]   = useState(true);

  /**
   * Data selecionada para a aba Finalizadas.
   * Default: hoje. Alterável pelo filtro de data na UI.
   */
  const [doneDate, setDoneDate] = useState<Date>(() => new Date());

  // Subscription: Em Atendimento — sem filtro de data, sempre carrega tudo
  useEffect(() => {
    if (!user) return;
    setLoadingActive(true);
    const unsub = subscribeToActiveTasks(user.uid, (data) => {
      setActiveTasks(data);
      setLoadingActive(false);
    });
    return unsub;
  }, [user]);

  // Subscription: Finalizadas — refaz a query quando doneDate muda
  useEffect(() => {
    if (!user) return;
    setLoadingDone(true);
    const unsub = subscribeToDoneTasks(user.uid, doneDate, (data) => {
      setDoneTasks(data);
      setLoadingDone(false);
    });
    return unsub;
  }, [user, doneDate]);

  // tasks unificado para lookups (ex: selectedTask no drawer)
  const tasks = [...activeTasks, ...doneTasks];

  const addTask = useCallback(async (input: Omit<CreateTaskInput, 'userId' | 'existingOrders'>) => {
    if (!user) return;
    const existingOrders = activeTasks.map(t => t.order);
    return createTask({ ...input, userId: user.uid, existingOrders });
  }, [user, activeTasks]);

  const editTask   = useCallback(async (id: string, data: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>) => updateTask(id, data), []);
  const removeTask = useCallback(async (id: string) => deleteTask(id), []);
  const reorder    = useCallback(async (updates: { id: string; order: number }[]) => reorderTasks(updates), []);

  return {
    tasks,
    activeTasks,
    doneTasks,
    loadingActive,
    loadingDone,
    doneDate,
    setDoneDate,
    addTask,
    editTask,
    removeTask,
    reorder,
  };
}

// ── Hook secundário: tarefas de uma demanda (DemandDrawer) ───────────────────
export function useTasksByDemand(demandId: string | null) {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !demandId) { setTasks([]); setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToTasksByDemand(user.uid, demandId, (data) => {
      setTasks(data);
      setLoading(false);
    });
    return unsub;
  }, [user, demandId]);

  const pendingTasks   = tasks.filter(t => ACTIVE_TASK_STATUSES.includes(t.status));
  const completedTasks = tasks.filter(t => DONE_TASK_STATUSES.includes(t.status));

  const editTask   = useCallback(async (id: string, data: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>) => updateTask(id, data), []);
  const removeTask = useCallback(async (id: string) => deleteTask(id), []);
  const reorder    = useCallback(async (updates: { id: string; order: number }[]) => reorderTasks(updates), []);

  return { tasks, pendingTasks, completedTasks, loading, editTask, removeTask, reorder };
}