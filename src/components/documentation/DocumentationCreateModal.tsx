'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FilePlus, X, RefreshCw } from 'lucide-react';
import { DocumentationCategory } from '@/types/index';
import { DOCUMENTATION_CATEGORIES } from '@/lib/constants';
import { DocumentationOperationSelector } from './DocumentationOperationSelector';

interface DocumentationCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    category: DocumentationCategory;
    operationIds: string[];
  }) => Promise<void> | void;
}

export function DocumentationCreateModal({
  open,
  onClose,
  onCreate,
}: DocumentationCreateModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentationCategory>('sistema');
  const [operationIds, setOperationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Reset fields on open
  useEffect(() => {
    if (open) {
      setTitle('');
      setCategory('sistema');
      setOperationIds([]);
      setLoading(false);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, loading, onClose]);

  // Click on backdrop to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current && !loading) onClose();
    },
    [loading, onClose]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;

    setLoading(true);
    try {
      await onCreate({
        title: title.trim(),
        category,
        operationIds,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const modal = (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-lg bg-popover border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-border/60">
            <div className="flex items-center gap-2.5 text-foreground">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                <FilePlus className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold">Nova Documentação</h2>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 rounded-md text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Título
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  required
                  placeholder="Ex: Integração com Webhook Cielo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Categoria / Tipo (Template)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentationCategory)}
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition"
                >
                  {DOCUMENTATION_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Associated Operations */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Operações Relacionadas
                </label>
                <p className="text-xs text-muted-foreground mb-1">
                  Selecione as operações que utilizam este recurso. Caso não escolha nenhuma, ficará em "Compartilhadas".
                </p>
                <DocumentationOperationSelector
                  selectedIds={operationIds}
                  onChange={setOperationIds}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-muted/20 border-t border-border/60 flex items-center justify-end gap-2.5">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-muted/40 text-secondary-foreground border border-border/70 hover:bg-muted hover:border-border disabled:opacity-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Criando...</span>
                  </>
                ) : (
                  <span>Criar Documento</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(modal, document.body)
    : null;
}
