import {
  collection, doc, addDoc, updateDoc, query,
  where, onSnapshot, Timestamp, orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { TimerEntry } from '@/types';

const COLLECTION = 'timers';

// ── Subscription: timers ativos (usado pelo TimerContext) ─────────────────────
export function subscribeToTimers(
  userId: string,
  callback: (timers: TimerEntry[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const timers = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as TimerEntry[];
    callback(timers);
  });
}

// ── Subscription: timers finalizados para analytics (com filtro de data) ──────
/**
 * Substitui getTimersForAnalytics (getDocs) por onSnapshot com filtro de data.
 * O Firestore filtra por endedAt no servidor — sem carregar todos os timers.
 *
 * Índice necessário: userId ASC + status ASC + endedAt ASC
 */
export function subscribeToTimersForAnalytics(
  userId: string,
  from: Date,
  to: Date,
  callback: (timers: TimerEntry[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('userId',  '==', userId),
    where('status',  '==', 'stopped'),
    where('endedAt', '>=', Timestamp.fromDate(from)),
    where('endedAt', '<=', Timestamp.fromDate(to)),
    orderBy('endedAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const timers = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as TimerEntry[];
    callback(timers);
  });
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

/**
 * Agora recebe demandTitle para armazenar junto ao timer.
 * Isso permite separar "Bradesco - Demanda A" de "Bradesco - Demanda B"
 * nos gráficos de analytics sem precisar buscar a demanda depois.
 */
export async function startTimer(
  userId: string,
  demandId: string,
  demandTitle: string,
  operation: string
): Promise<string> {
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, COLLECTION), {
    userId,
    demandId,
    demandTitle,
    operation,
    startedAt: now,
    durationSeconds: 0,
    status: 'running',
    createdAt: now,
  });
  return ref.id;
}

export async function pauseTimer(
  timerId: string,
  accumulatedSeconds: number
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, timerId), {
    startedAt: null,
    durationSeconds: accumulatedSeconds,
    status: 'paused',
  });
}

export async function resumeTimer(timerId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, timerId), {
    startedAt: Timestamp.now(),
    status: 'running',
  });
}

export async function stopTimer(
  timerId: string,
  finalSeconds: number
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, timerId), {
    endedAt: Timestamp.now(),
    durationSeconds: finalSeconds,
    status: 'stopped',
  });
}