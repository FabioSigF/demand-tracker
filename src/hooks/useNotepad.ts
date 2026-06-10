'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  subscribeToNotePages,
  createNotePage,
  updateNotePage,
  deleteNotePage,
} from '@/services/notepad.service';
import { NotePage } from '@/types/index';

export function useNotepad() {
  const { user } = useAuthContext();
  const [pages, setPages] = useState<NotePage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotePages(user.uid, (data) => {
      setPages(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const addPage = useCallback(async (): Promise<string | undefined> => {
    if (!user) return;
    const orders = pages.map(p => p.order);
    return createNotePage(user.uid, orders);
  }, [user, pages]);

  const editPage = useCallback(async (
    id: string,
    data: Partial<Pick<NotePage, 'title' | 'content' | 'order'>>
  ) => updateNotePage(id, data), []);

  const removePage = useCallback(async (id: string) => deleteNotePage(id), []);

  return { pages, loading, addPage, editPage, removePage };
}