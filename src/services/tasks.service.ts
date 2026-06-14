import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, TaskStatus } from '@/types/index';
import { Operation } from '@/types';

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
  operation: Operation;
  title: string;
  description: string;
  dueDate?: Timestamp;
  existingOrders?: number[];
}

export async function createTask(input: CreateTaskInput): Promise<string> {
  const { existingOrders = [], ...data } = input;
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    status: 'Pendente' as TaskStatus,
    order:  generateOrder(existingOrders),
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
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
  await updateDoc(doc(db, COLLECTION, id), updateData);
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