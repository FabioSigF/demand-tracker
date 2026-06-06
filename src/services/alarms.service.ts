import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, Timestamp, orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { Alarm } from '@/types';

const COLLECTION = 'alarms';

export function subscribeToAlarms(
  userId: string,
  callback: (alarms: Alarm[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('scheduledAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const alarms = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Alarm[];
    callback(alarms);
  });
}

export async function createAlarm(
  userId: string,
  data: { title: string; description?: string; scheduledAt: Timestamp }
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    userId,
    ...data,
    fired: false,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function markAlarmFired(alarmId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, alarmId), { fired: true });
}

export async function deleteAlarm(alarmId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, alarmId));
}
