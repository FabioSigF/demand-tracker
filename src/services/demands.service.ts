import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Demand, Status } from '@/types';
import { generateOrder } from '@/lib/utils';

const COLLECTION = 'demands';

export function subscribeToDemands(
  userId: string,
  callback: (demands: Demand[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('order', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const demands = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Demand[];

    console.log(
      '[snapshot]',
      demands.find(d => d.id === 'jIUMTz4fZX069BPminwt')
    );

    callback(demands);
  });
}

export async function createDemand(
  userId: string,
  existingOrders: number[]
): Promise<string> {
  const now = Timestamp.now();
  const newDemand = {
    userId,
    demandId: '',
    operation: 'Outro',
    task: '',
    startDate: now,
    deadline: now,
    status: 'Pendente' as Status,
    notes: '',
    history: '',
    order: generateOrder(existingOrders),
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, COLLECTION), newDemand);
  return ref.id;
}

export async function updateDemand(
  id: string,
  data: Partial<Omit<Demand, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  console.group('[updateDemand]');
  console.trace();
  console.log('id:', id);
  console.log('data:', data);
  console.groupEnd();

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: Timestamp.now(),
  };
  // Auto-fill completedAt
  if (data.status === 'Concluído') {
    updateData.completedAt = Timestamp.now();
  } else if (data.status) {
    updateData.completedAt = null;
  }
  await updateDoc(doc(db, COLLECTION, id), updateData);

  console.log('[updateDemand] DEPOIS')
}

export async function deleteDemand(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function reorderDemands(
  updates: { id: string; order: number }[]
): Promise<void> {
  const batch = writeBatch(db);
  updates.forEach(({ id, order }) => {
    batch.update(doc(db, COLLECTION, id), { order, updatedAt: Timestamp.now() });
  });
  await batch.commit();
}
