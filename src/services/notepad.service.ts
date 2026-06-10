import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { NotePage } from '@/types/index';

const COLLECTION = 'notepad_pages';

export function subscribeToNotePages(
  userId: string,
  callback: (pages: NotePage[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('order', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as NotePage)));
  });
}

export async function createNotePage(userId: string, existingOrders: number[]): Promise<string> {
  const now = Timestamp.now();
  const order = existingOrders.length === 0 ? 1000 : Math.max(...existingOrders) + 1000;
  const ref = await addDoc(collection(db, COLLECTION), {
    userId,
    title: 'Nova página',
    content: '',
    order,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateNotePage(
  id: string,
  data: Partial<Pick<NotePage, 'title' | 'content' | 'order'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteNotePage(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}