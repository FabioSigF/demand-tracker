'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  subscribeToDemands,
  createDemand,
  updateDemand,
  deleteDemand,
  reorderDemands,
} from '@/services/demands.service';
import { Demand } from '@/types';
import { ACTIVE_STATUSES, DONE_STATUSES } from '@/lib/constants';

export function useDemands() {
  const { user } = useAuthContext();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToDemands(user.uid, (data) => {
      setDemands(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const activeDemands = demands.filter(d => ACTIVE_STATUSES.includes(d.status));
  const doneDemands = demands.filter(d => DONE_STATUSES.includes(d.status));

  const addDemand = useCallback(async () => {
    if (!user) return;
    const orders = demands.map(d => d.order);
    return createDemand(user.uid, orders);
  }, [user, demands]);

  const editDemand = useCallback(async (
    id: string,
    data: Partial<Omit<Demand, 'id' | 'userId' | 'createdAt'>>
  ) => {
    return updateDemand(id, data);
  }, []);

  const removeDemand = useCallback(async (id: string) => {
    return deleteDemand(id);
  }, []);

  const reorder = useCallback(async (updates: { id: string; order: number }[]) => {
    return reorderDemands(updates);
  }, []);

  return {
    demands,
    activeDemands,
    doneDemands,
    loading,
    addDemand,
    editDemand,
    removeDemand,
    reorder,
  };
}
