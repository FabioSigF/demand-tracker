import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  query, where, orderBy, onSnapshot, Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, TaskRecurrence, TaskStatus, TaskType } from '@/types/index';
import { getNextDueDate } from '@/lib/recurrence';
// Operation is typed as string below

const COLLECTION = 'tasks';

// ── Helpers de data ───────────────────────────────────────────────────────────

export function dayStart(date: Date): Timestamp {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

export function dayEnd(date: Date): Timestamp {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return Timestamp.fromDate(d);
}

function generateOrder(existingOrders: number[]): number {
  return existingOrders.length === 0 ? 1000 : Math.max(...existingOrders) + 1000;
}

// ── Subscription: tarefas Em Atendimento ─────────────────────────────────────
/**
 * Carrega TODAS as tarefas ativas do usuário (Pendente + Em andamento).
 * Sem filtro de data — tarefas em atendimento aparecem sempre,
 * independentemente de quando foram criadas ou do prazo.
 *
 * Índice: userId ASC + status ASC + order ASC
 */
export function subscribeToActiveTasks(
  userId: string,
  callback: (tasks: Task[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('status', 'in', ['Pendente', 'Em andamento']),
    orderBy('order', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
  });
}

// ── Subscription: tarefas Finalizadas (com filtro de data) ───────────────────
/**
 * Carrega tarefas finalizadas (Concluída + Cancelado) pelo campo completedAt.
 * O filtro de data é aplicado na query do Firestore — sem carregamento
 * desnecessário de dados.
 *
 * Índice: userId ASC + completedAt ASC (ou DESC)
 */
export function subscribeToDoneTasks(
  userId: string,
  date: Date,
  callback: (tasks: Task[]) => void
): () => void {
  const start = dayStart(date);
  const end   = dayEnd(date);

  const q = query(
    collection(db, COLLECTION),
    where('userId',      '==', userId),
    where('completedAt', '>=', start),
    where('completedAt', '<=', end),
    orderBy('completedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
  });
}

// ── Subscription: tarefas de uma demanda ─────────────────────────────────────
/**
 * userId incluído para respeitar as regras de segurança do Firestore.
 * Índice: userId ASC + demandId ASC + order ASC
 */
export function subscribeToTasksByDemand(
  userId: string,
  demandId: string,
  callback: (tasks: Task[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('userId',   '==', userId),
    where('demandId', '==', demandId),
    orderBy('order', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
  });
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  userId: string;
  demandId: string;
  demandTitle: string;
  operation: string;
  title: string;
  description: string;
  priority?: number;
  dueDate?: Timestamp;
  recurrence?: TaskRecurrence;
  type?: TaskType;
  existingOrders?: number[];
}

/** Demanda alvo ao criar a mesma tarefa em várias demandas de uma vez */
export interface TaskDemandTarget {
  demandId: string;
  demandTitle: string;
  operation: string;
}

export const isEventTask = (task: Pick<Task, 'type'>) => task.type === 'event';

/** Eventos primeiro, por data/hora; depois tarefas, por prioridade e criação */
export function sortTasksByPriorityAndTime(tasks: Task[], timeOrder: 'asc' | 'desc' = 'asc'): Task[] {
  return [...tasks].sort((a, b) => {
    const evA = isEventTask(a);
    const evB = isEventTask(b);
    if (evA !== evB) return evA ? -1 : 1;
    if (evA && evB) {
      const dA = a.dueDate?.toDate ? a.dueDate.toDate().getTime() : 0;
      const dB = b.dueDate?.toDate ? b.dueDate.toDate().getTime() : 0;
      return dA - dB;
    }

    const pA = a.priority ?? 0;
    const pB = b.priority ?? 0;
    if (pB !== pA) {
      return pB - pA; // Higher priority first
    }
    const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return timeOrder === 'asc' ? tA - tB : tB - tA;
  });
}

function buildNewTask(input: CreateTaskInput, now: Timestamp) {
  const { existingOrders = [], ...data } = input;
  return {
    ...data,
    priority: data.priority ?? 0,
    recurrence: data.recurrence ?? 'none',
    type: data.type ?? 'task',
    status: 'Pendente' as TaskStatus,
    order:  generateOrder(existingOrders),
    createdAt: now,
    updatedAt: now,
    dueDate: data.dueDate ? data.dueDate : now,
  };
}

export async function createTask(input: CreateTaskInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), buildNewTask(input, Timestamp.now()));
  return ref.id;
}

/** Usado por eventos que não pertencem a nenhuma demanda */
export const NO_DEMAND_TARGET: TaskDemandTarget = { demandId: '', demandTitle: '', operation: '' };

/**
 * Cria uma cópia da tarefa para cada demanda, em uma única escrita atômica.
 * Sem demandas, cria um único item avulso (permitido apenas para eventos).
 */
export async function createTaskForDemands(
  input: Omit<CreateTaskInput, 'demandId' | 'demandTitle' | 'operation'>,
  targets: TaskDemandTarget[]
): Promise<string[]> {
  if (targets.length === 0 && input.type !== 'event') {
    throw new Error('Tarefas precisam de ao menos uma demanda');
  }
  const now   = Timestamp.now();
  const batch = writeBatch(db);
  const ids = (targets.length ? targets : [NO_DEMAND_TARGET]).map(target => {
    const ref = doc(collection(db, COLLECTION));
    batch.set(ref, buildNewTask({ ...input, ...target }, now));
    return ref.id;
  });
  await batch.commit();
  return ids;
}

export async function updateTask(
  id: string,
  data: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: Timestamp.now(),
  };
  if (data.status === 'Concluída' || data.status === 'Cancelado') {
    updateData.completedAt = Timestamp.now();
  } else if (data.status === 'Pendente' || data.status === 'Em andamento') {
    updateData.completedAt = null;
  }

  const ref = doc(db, COLLECTION, id);

  // Concluir uma tarefa recorrente gera a próxima ocorrência (uma única vez)
  if (data.status === 'Concluída') {
    const snap = await getDoc(ref);
    const current = snap.exists() ? ({ id: snap.id, ...snap.data() } as Task) : null;
    const recurrence = data.recurrence ?? current?.recurrence;
    if (current && recurrence && recurrence !== 'none' && !current.nextTaskId) {
      const now     = Timestamp.now();
      const baseDue = (data.dueDate ?? current.dueDate ?? now).toDate();
      const nextRef = doc(collection(db, COLLECTION));
      const batch   = writeBatch(db);
      batch.set(nextRef, buildNewTask({
        userId:      current.userId,
        demandId:    current.demandId,
        demandTitle: current.demandTitle,
        operation:   current.operation,
        title:       data.title ?? current.title,
        description: data.description ?? current.description,
        priority:    data.priority ?? current.priority,
        recurrence,
        type:        current.type,
        dueDate:     Timestamp.fromDate(getNextDueDate(baseDue, recurrence)),
        existingOrders: [current.order],
      }, now));
      batch.update(ref, { ...updateData, nextTaskId: nextRef.id });
      await batch.commit();
      return;
    }
  }

  await updateDoc(ref, updateData);
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function reorderTasks(
  updates: { id: string; order: number }[]
): Promise<void> {
  const batch = writeBatch(db);
  updates.forEach(({ id, order }) => {
    batch.update(doc(db, COLLECTION, id), { order, updatedAt: Timestamp.now() });
  });
  await batch.commit();
}