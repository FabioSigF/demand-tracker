'use client';
import { useEffect, useState, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useAuthContext } from '@/contexts/AuthContext';
import { subscribeToAlarms, createAlarm, deleteAlarm } from '@/services/alarms.service';
import { Alarm } from '@/types';
import { toast } from 'sonner';

export function useAlarms() {
  const { user } = useAuthContext();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToAlarms(user.uid, (data) => {
      setAlarms(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const addAlarm = useCallback(async (data: {
    title: string;
    description?: string;
    scheduledAt: Timestamp;
  }) => {
    if (!user) return;
    try {
      await createAlarm(user.uid, data);
      toast.success('Alarme criado');
    } catch {
      toast.error('Erro ao criar alarme');
    }
  }, [user]);

  const removeAlarm = useCallback(async (id: string) => {
    try {
      await deleteAlarm(id);
      toast.success('Alarme removido');
    } catch {
      toast.error('Erro ao remover alarme');
    }
  }, []);

  return { alarms, loading, addAlarm, removeAlarm };
}
