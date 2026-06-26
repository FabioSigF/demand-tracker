'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  subscribeToDocumentation,
  createDocumentation,
  updateDocumentation,
  deleteDocumentation,
  reorderDocumentation,
} from '@/services/documentation.service';
import { DocumentationPage, DocumentationCategory } from '@/types/index';

export function useDocumentation() {
  const { user } = useAuthContext();
  const [pages, setPages] = useState<DocumentationPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToDocumentation(user.uid, (data) => {
      setPages(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const addPage = useCallback(async (data: {
    title: string;
    category: DocumentationCategory;
    operationIds: string[];
    relatedDemandIds?: string[];
  }): Promise<string | undefined> => {
    if (!user) return;
    const orders = pages.map(p => p.order);
    return createDocumentation(user.uid, data, orders);
  }, [user, pages]);

  const editPage = useCallback(async (
    id: string,
    data: Partial<Omit<DocumentationPage, 'id' | 'userId' | 'createdAt'>>
  ) => {
    console.log("[editPage] calling updateDocumentation for id:", id, "data:", data);
    try {
      await updateDocumentation(id, data);
      console.log("[editPage] updateDocumentation resolved successfully");
    } catch (err) {
      console.error("[editPage] updateDocumentation rejected with error:", err);
      throw err;
    }
  }, []);

  const removePage = useCallback(async (id: string) => {
    await deleteDocumentation(id);
  }, []);

  const reorder = useCallback(async (updates: { id: string; order: number }[]) => {
    await reorderDocumentation(updates);
  }, []);

  return { pages, loading, addPage, editPage, removePage, reorder };
}
