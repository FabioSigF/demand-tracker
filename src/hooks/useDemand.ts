'use client';
import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Demand } from '@/types';
import { updateDemand } from '@/services/demands.service';

/**
 * Busca uma única demanda por ID via onSnapshot.
 * Só inicia a subscription quando demandId é não-nulo.
 * Cancela e limpa ao trocar de demandId ou desmontar.
 */
export function useDemand(demandId: string | null) {
  const [demand, setDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!demandId) {
      setDemand(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(
      doc(db, 'demands', demandId),
      (snap) => {
        if (snap.exists()) {
          setDemand({ id: snap.id, ...snap.data() } as Demand);
        } else {
          setDemand(null);
        }
        setLoading(false);
      },
      () => {
        setDemand(null);
        setLoading(false);
      }
    );

    return unsub;
  }, [demandId]);

  const editDemand = useCallback(async (
    id: string,
    data: Partial<Omit<Demand, 'id' | 'userId' | 'createdAt'>>
  ) => updateDemand(id, data), []);

  return { demand, loading, editDemand };
}