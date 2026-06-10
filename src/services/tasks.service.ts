import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, Timestamp,
  or, and,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, TaskStatus } from '@/types/index';
import { Operation } from '@/types';

const COLLECTION = 'tasks';

// ── Helpers de data ───────────────────────────────────────────────────────────

function todayStart(): Timestamp {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

function todayEnd(): Timestamp {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return Timestamp.fromDate(d);
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

/**
 * Carrega apenas tarefas relevantes para hoje:
 *   1. Criadas hoje
 *   2. Com prazo para hoje e ainda não concluídas
 *   3. Finalizadas hoje
 *
 * Firestore não suporta OR composto em queries simples com índices diferentes,
 * então usamos três listeners separados e mesclamos no cliente.
 * O callback recebe a lista já deduplicada e ordenada por createdAt desc.
 */
export function subscribeToTodayTasks(
  userId: string,
  callback: (tasks: Task[]) => void
): () => void {
  const start = todayStart();
  const end   = todayEnd();
  const map   = new Map<string, Task>();

  const notify = () => {
    const sorted = Array.from(map.values()).sort(
      (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
    );
    callback(sorted);
  };

  // 1. Criadas hoje
  const unsubCreated = onSnapshot(
    query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      orderBy('createdAt', 'desc')
    ),
    (snap) => {
      snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Task));
      // Limpa do map as que foram removidas desta query
      snap.docChanges().forEach(change => {
        if (change.type === 'removed') map.delete(change.doc.id);
      });
      notify();
    }
  );

  // 2. Com prazo hoje e pendentes
  const unsubDue = onSnapshot(
    query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('dueDate', '>=', start),
      where('dueDate', '<=', end),
      where('status', '==', 'Pendente'),
      orderBy('dueDate', 'asc')
    ),
    (snap) => {
      snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Task));
      snap.docChanges().forEach(change => {
        if (change.type === 'removed') {
          // Só remove se não estiver em outra query
          const existing = map.get(change.doc.id);
          if (existing) {
            const createdToday =
              existing.createdAt.toMillis() >= start.toMillis() &&
              existing.createdAt.toMillis() <= end.toMillis();
            const completedToday =
              existing.completedAt &&
              existing.completedAt.toMillis() >= start.toMillis() &&
              existing.completedAt.toMillis() <= end.toMillis();
            if (!createdToday && !completedToday) map.delete(change.doc.id);
          }
        }
      });
      notify();
    }
  );

  // 3. Finalizadas hoje
  const unsubDone = onSnapshot(
    query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      where('completedAt', '>=', start),
      where('completedAt', '<=', end),
      orderBy('completedAt', 'desc')
    ),
    (snap) => {
      snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Task));
      snap.docChanges().forEach(change => {
        if (change.type === 'removed') {
          const existing = map.get(change.doc.id);
          if (existing) {
            const createdToday =
              existing.createdAt.toMillis() >= start.toMillis() &&
              existing.createdAt.toMillis() <= end.toMillis();
            if (!createdToday) map.delete(change.doc.id);
          }
        }
      });
      notify();
    }
  );

  return () => {
    unsubCreated();
    unsubDue();
    unsubDone();
  };
}

/**
 * Todas as tarefas de uma demanda específica (sem filtro de data).
 * Usado pelo DemandDrawer para listar tarefas vinculadas.
 */
export function subscribeToTasksByDemand(
  demandId: string,
  callback: (tasks: Task[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('demandId', '==', demandId),
    orderBy('createdAt', 'asc')
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
}

export async function createTask(input: CreateTaskInput): Promise<string> {
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, COLLECTION), {
    ...input,
    status: 'Pendente' as TaskStatus,
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
  if (data.status === 'Concluída') {
    updateData.completedAt = Timestamp.now();
  } else if (data.status === 'Pendente') {
    updateData.completedAt = null;
  }
  await updateDoc(doc(db, COLLECTION, id), updateData);
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}