'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  subscribeToTodayTasks,
  subscribeToTasksByDemand,
  createTask,
  updateTask,
  deleteTask,
  CreateTaskInput,
} from '@/services/tasks.service';
import { Task } from '@/types/index';

// Status que representam tarefas ativas (Em Atendimento)
const ACTIVE_TASK_STATUSES = ['Pendente', 'Em andamento'];
// Status que representam tarefas finalizadas
const DONE_TASK_STATUSES   = ['Concluída', 'Cancelado'];

// ── Hook principal: tarefas do dia (página Tarefas) ───────────────────────────
export function useTasks() {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToTodayTasks(user.uid, (data) => {
      setTasks(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  // "Em Atendimento" — Pendente + Em andamento
  const activeTasks = tasks.filter(t => ACTIVE_TASK_STATUSES.includes(t.status));

  // "Finalizadas" — Concluída + Cancelado
  const doneTasks   = tasks.filter(t => DONE_TASK_STATUSES.includes(t.status));

  // Mantém pendingTasks como alias de activeTasks para compatibilidade
  const pendingTasks = activeTasks;

  const addTask = useCallback(async (input: Omit<CreateTaskInput, 'userId'>) => {
    if (!user) return;
    return createTask({ ...input, userId: user.uid });
  }, [user]);

  const editTask = useCallback(async (
    id: string,
    data: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>
  ) => updateTask(id, data), []);

  const removeTask = useCallback(async (id: string) => deleteTask(id), []);

  return {
    tasks,
    activeTasks,
    pendingTasks,  // alias — mantém compatibilidade com TasksTable
    doneTasks,
    loading,
    addTask,
    editTask,
    removeTask,
  };
}

// ── Hook secundário: tarefas de uma demanda (DemandDrawer) ────────────────────
export function useTasksByDemand(demandId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!demandId) { setTasks([]); setLoading(false); return; }
    const unsub = subscribeToTasksByDemand(demandId, (data) => {
      setTasks(data);
      setLoading(false);
    });
    return unsub;
  }, [demandId]);

  const pendingTasks   = tasks.filter(t => ACTIVE_TASK_STATUSES.includes(t.status));
  const completedTasks = tasks.filter(t => DONE_TASK_STATUSES.includes(t.status));

  const editTask   = useCallback(async (id: string, data: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>) => updateTask(id, data), []);
  const removeTask = useCallback(async (id: string) => deleteTask(id), []);

  return { tasks, pendingTasks, completedTasks, loading, editTask, removeTask };
}