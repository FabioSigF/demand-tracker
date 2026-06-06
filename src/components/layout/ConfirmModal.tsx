'use client';
import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, RefreshCw, CheckCircle } from 'lucide-react';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
      // Tab trap: cycle focus between cancel and confirm
      if (e.key === 'Tab') {
        const focusable = [cancelBtnRef.current, confirmBtnRef.current].filter(Boolean) as HTMLElement[];
        if (focusable.length === 0) return;
        const idx = focusable.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        if (e.shiftKey) {
          focusable[(idx - 1 + focusable.length) % focusable.length].focus();
        } else {
          focusable[(idx + 1) % focusable.length].focus();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, loading, onCancel]);

  // Auto-focus cancel button when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => cancelBtnRef.current?.focus(), 50);
    }
  }, [open]);

  // Click on backdrop to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current && !loading) onCancel();
    },
    [loading, onCancel]
  );

  if (!open) return null;

  const isDestructive = variant === 'destructive';

  const Icon = isDestructive ? Trash2 : CheckCircle;

  const modal = (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={description ? 'confirm-modal-description' : undefined}
        className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-sm bg-popover border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

          {/* Icon + Header */}
          <div className="px-6 pt-6 pb-4 flex flex-col items-start gap-3">
            <div
              className={[
                'flex items-center justify-center w-10 h-10 rounded-full',
                isDestructive
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-primary/10 text-primary',
              ].join(' ')}
            >
              {isDestructive ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-1">
              <h2
                id="confirm-modal-title"
                className="text-base font-semibold text-foreground leading-snug"
              >
                {title}
              </h2>
              {description && (
                <p
                  id="confirm-modal-description"
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/60 mx-6" />

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-end gap-2.5">
            {/* Cancel */}
            <button
              ref={cancelBtnRef}
              onClick={onCancel}
              disabled={loading}
              className="
                inline-flex items-center justify-center gap-1.5
                px-4 py-2 rounded-lg text-sm font-medium
                bg-muted/40 text-secondary-foreground
                border border-border/70
                hover:bg-muted hover:border-border
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
                transition
              "
            >
              {cancelText}
            </button>

            {/* Confirm */}
            <button
              ref={confirmBtnRef}
              onClick={onConfirm}
              disabled={loading}
              className={[
                'inline-flex items-center justify-center gap-1.5',
                'px-4 py-2 rounded-lg text-sm font-medium',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                'transition',
                isDestructive
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary',
              ].join(' ')}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Aguarde...</span>
                </>
              ) : (
                <>
                  {isDestructive && <Trash2 className="w-3.5 h-3.5" />}
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // Portal: renderiza acima de toda a aplicação
  return typeof document !== 'undefined'
    ? createPortal(modal, document.body)
    : null;
}