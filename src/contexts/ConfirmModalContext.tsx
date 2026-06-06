'use client';
import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { ConfirmModal, ConfirmModalProps } from '@/components/layout/ConfirmModal';

type ConfirmOptions = Pick<
  ConfirmModalProps,
  'title' | 'description' | 'confirmText' | 'cancelText' | 'variant'
>;

interface ConfirmContextValue {
  /** Abre o modal e retorna uma Promise<boolean>.
   *  true  → usuário confirmou
   *  false → usuário cancelou / fechou  */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: '' });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    setLoading(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    resolverRef.current?.(true);
    resolverRef.current = null;
    setOpen(false);
    setLoading(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (loading) return;
    resolverRef.current?.(false);
    resolverRef.current = null;
    setOpen(false);
  }, [loading]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Um único modal para toda a aplicação */}
      <ConfirmModal
        open={open}
        loading={loading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        {...options}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm deve ser usado dentro de <ConfirmModalProvider>');
  }
  return ctx;
}