'use client';
import { useState, useCallback } from 'react';

interface UseConfirmModalOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

/**
 * Hook auxiliar que abstrai o estado do ConfirmModal.
 * Retorna props prontas para passar ao componente e uma função `confirm()`
 * que retorna uma Promise<boolean> — true se confirmado, false se cancelado.
 *
 * Uso:
 *   const { modalProps, confirm } = useConfirmModal({
 *     title: 'Excluir demanda',
 *     description: 'Esta ação não poderá ser desfeita.',
 *     variant: 'destructive',
 *   });
 *
 *   const handleDelete = async () => {
 *     const ok = await confirm();
 *     if (!ok) return;
 *     // ... prossegue com a ação
 *   };
 */
export function useConfirmModal(options: UseConfirmModalOptions) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      setOpen(true);
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    setOpen(false);
    resolver?.(true);
    setResolver(null);
  }, [resolver]);

  const handleCancel = useCallback(() => {
    if (loading) return;
    setOpen(false);
    resolver?.(false);
    setResolver(null);
  }, [loading, resolver]);

  const modalProps = {
    open,
    loading,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
    ...options,
  };

  return { modalProps, confirm, setLoading };
}