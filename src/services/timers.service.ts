import {
  collection, doc, addDoc, updateDoc, query,
  where, onSnapshot, Timestamp, orderBy, getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { TimerEntry, Operation } from '@/types';

const COLLECTION = 'timers';

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

export async function startTimer(
  userId: string,
  demandId: string,
  operation: Operation
): Promise<string> {
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, COLLECTION), {
    userId,
    demandId,
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

export async function getTimersForAnalytics(
  userId: string
): Promise<TimerEntry[]> {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    where('status', '==', 'stopped')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as TimerEntry[];
}
