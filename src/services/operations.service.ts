import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Operation } from '@/types';

const COLLECTION = 'operations';

export function subscribeToOperations(
  userId: string | null,
  callback: (operations: Operation[]) => void
): () => void {
  const userIds: (string | null)[] = [null];
  if (userId) {
    userIds.push(userId);
  }

  const q = query(
    collection(db, COLLECTION),
    where('userId', 'in', userIds),
    orderBy('name', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const operations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Operation[];
    callback(operations);
  });
}

export async function createOperation(
  userId: string,
  name: string,
  color?: string
): Promise<string> {
  const now = Timestamp.now();
  const newOp = {
    name,
    color,
    userId,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await addDoc(collection(db, COLLECTION), newOp);
  return ref.id;
}

export async function updateOperation(
  id: string,
  name: string,
  color?: string
): Promise<void> {
  const updateData: Record<string, any> = {
    name,
    updatedAt: Timestamp.now(),
  };
  if (color !== undefined) {
    updateData.color = color;
  }
  await updateDoc(doc(db, COLLECTION, id), updateData);
}

export async function deleteOperation(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
