'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuthContext } from './AuthContext';
import { Operation } from '@/types';
import {
  subscribeToOperations,
  createOperation,
  updateOperation,
  deleteOperation,
} from '@/services/operations.service';
import { toast } from 'sonner';

interface OperationsContextType {
  operations: Operation[];
  loading: boolean;
  addOperation: (name: string, color?: string) => Promise<void>;
  editOperation: (id: string, name: string, color?: string) => Promise<void>;
  removeOperation: (id: string) => Promise<void>;
}

const OperationsContext = createContext<OperationsContextType | null>(null);

export function OperationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If user is null, we still subscribe to get default operations (userId = null)
    const unsubscribe = subscribeToOperations(user?.uid ?? null, (data) => {
      setOperations(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const addOperation = useCallback(async (name: string, color?: string) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Nome da operação é obrigatório');
      return;
    }
    if (operations.some(op => op.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Uma operação com este nome já existe');
      return;
    }
    try {
      await createOperation(user.uid, trimmed, color);
      toast.success('Operação criada com sucesso');
    } catch (e) {
      toast.error('Erro ao criar operação');
      console.error(e);
    }
  }, [user, operations]);

  const editOperation = useCallback(async (id: string, name: string, color?: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Nome da operação é obrigatório');
      return;
    }
    if (operations.some(op => op.id !== id && op.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Uma operação com este nome já existe');
      return;
    }
    try {
      await updateOperation(id, trimmed, color);
      toast.success('Operação atualizada com sucesso');
    } catch (e) {
      toast.error('Erro ao atualizar operação');
      console.error(e);
    }
  }, [operations]);

  const removeOperation = useCallback(async (id: string) => {
    try {
      await deleteOperation(id);
      toast.success('Operação removida com sucesso');
    } catch (e) {
      toast.error('Erro ao remover operação');
      console.error(e);
    }
  }, []);

  return (
    <OperationsContext.Provider value={{ operations, loading, addOperation, editOperation, removeOperation }}>
      {children}
    </OperationsContext.Provider>
  );
}

export function useOperationsContext() {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error('useOperationsContext must be used within an OperationsProvider');
  }
  return context;
}
