import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, Timestamp, writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { DocumentationPage, DocumentationCategory } from '@/types/index';
import { DOCUMENTATION_TEMPLATES } from '@/lib/constants';

const COLLECTION = 'documentation_pages';

export function subscribeToDocumentation(
  userId: string,
  callback: (pages: DocumentationPage[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('order', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentationPage)));
  });
}

export async function createDocumentation(
  userId: string,
  data: {
    title: string;
    category: DocumentationCategory;
    operationIds: string[];
    relatedDemandIds?: string[];
  },
  existingOrders: number[]
): Promise<string> {
  const now = Timestamp.now();
  const order = existingOrders.length === 0 ? 1000 : Math.max(...existingOrders) + 1000;
  
  // Use template based on the category
  const content = DOCUMENTATION_TEMPLATES[data.category] || '';

  const ref = await addDoc(collection(db, COLLECTION), {
    userId,
    title: data.title,
    content,
    category: data.category,
    operationIds: data.operationIds,
    relatedDemandIds: data.relatedDemandIds || [],
    order,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateDocumentation(
  id: string,
  data: Partial<Omit<DocumentationPage, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteDocumentation(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function reorderDocumentation(
  updates: { id: string; order: number }[]
): Promise<void> {
  const batch = writeBatch(db);
  updates.forEach(({ id, order }) => {
    batch.update(doc(db, COLLECTION, id), { order, updatedAt: Timestamp.now() });
  });
  await batch.commit();
}
