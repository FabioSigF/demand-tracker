'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDemands } from '@/hooks/useDemands';
import { createTask } from '@/services/tasks.service';
import { useAuthContext } from '@/contexts/AuthContext';
import { Demand } from '@/types';
import { Search, X, Plus, RefreshCw, ChevronRight } from 'lucide-react';
import { OperationBadge } from '../demands/OperationBadge';
import { toast } from 'sonner';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  /** Se fornecido, pré-seleciona a demanda e não mostra o passo de busca */
  preselectedDemand?: Demand | null;
}

export function CreateTaskModal({ open, onClose, preselectedDemand }: CreateTaskModalProps) {
  const { user } = useAuthContext();
  const { demands } = useDemands();

  // ── Passos: 'demand' → 'task' ─────────────────────────────────────────────
  const [step, setStep] = useState<'demand' | 'task'>(
    preselectedDemand ? 'task' : 'demand'
  );

  const [search,          setSearch]          = useState('');
  const [selectedDemand,  setSelectedDemand]  = useState<Demand | null>(preselectedDemand ?? null);
  const [title,           setTitle]           = useState('');
  const [description,     setDescription]     = useState('');
  const [saving,          setSaving]          = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const overlayRef    = useRef<HTMLDivElement>(null);

  // Reset ao abrir
  useEffect(() => {
    if (!open) return;
    if (preselectedDemand) {
      setStep('task');
      setSelectedDemand(preselectedDemand);
    } else {
      setStep('demand');
      setSelectedDemand(null);
    }
    setSearch('');
    setTitle('');
    setDescription('');
    setSaving(false);
  }, [open, preselectedDemand]);

  // Foca no input de título ao entrar no passo de task
  useEffect(() => {
    if (step === 'task') {
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [step]);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Filtra demandas ativas pela busca
  const filteredDemands = demands
    .filter(d => !['Concluído', 'Cancelado'].includes(d.status))
    .filter(d => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        d.task.toLowerCase().includes(s) ||
        d.demandId.toLowerCase().includes(s) ||
        d.operation.toLowerCase().includes(s)
      );
    });

  const handleSelectDemand = (demand: Demand) => {
    setSelectedDemand(demand);
    setStep('task');
  };

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Informe um título para a tarefa'); return; }
    if (!selectedDemand) { toast.error('Selecione uma demanda'); return; }
    if (!user) return;

    setSaving(true);
    try {
      await createTask({
        userId:      user.uid,
        demandId:    selectedDemand.id,
        demandTitle: selectedDemand.task || '',
        operation:   selectedDemand.operation,
        title:       title.trim(),
        description: description.trim(),
      });
      toast.success('Tarefa criada');
      onClose();
    } catch {
      toast.error('Erro ao criar tarefa');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const modal = (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nova tarefa"
        className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-md bg-popover border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              {step === 'task' && !preselectedDemand && (
                <button
                  onClick={() => setStep('demand')}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              )}
              <h2 className="text-sm font-semibold text-foreground">
                {step === 'demand' ? 'Nova Tarefa — Selecionar Demanda' : 'Nova Tarefa'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Passo 1: selecionar demanda ── */}
          {step === 'demand' && (
            <div className="flex flex-col min-h-0 flex-1">
              {/* Search */}
              <div className="px-4 pt-3 pb-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar demanda por título, ID ou operação..."
                    className="w-full bg-muted/40 hover:bg-muted focus:bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
                  />
                </div>
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-y-auto px-2 pb-3 min-h-0 space-y-0.5">
                {filteredDemands.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 italic">
                    {search ? 'Nenhuma demanda encontrada.' : 'Nenhuma demanda ativa.'}
                  </p>
                ) : (
                  filteredDemands.map(demand => (
                    <button
                      key={demand.id}
                      onClick={() => handleSelectDemand(demand)}
                      className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition text-left group"
                    >
                      <div className="shrink-0 mt-0.5">
                        <OperationBadge operation={demand.operation} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition">
                          {demand.task || <span className="italic text-muted-foreground">Sem título</span>}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {demand.demandId || '—'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-1 transition" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Passo 2: preencher tarefa ── */}
          {step === 'task' && selectedDemand && (
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">

                {/* Demanda selecionada — informativo */}
                <div className="flex items-center gap-3 bg-muted/30 border border-border/60 rounded-xl px-3 py-2.5">
                  <OperationBadge operation={selectedDemand.operation} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Demanda vinculada</p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {selectedDemand.task || 'Sem título'}
                    </p>
                  </div>
                </div>

                {/* Título */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Título da Tarefa <span className="text-destructive">*</span>
                  </label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    maxLength={200}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleCreate(); }}
                    placeholder="O que precisa ser feito?"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition"
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Descrição
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Detalhes adicionais (opcional)..."
                    rows={3}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-border/60 shrink-0 flex items-center justify-end gap-2.5">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-muted/40 text-secondary-foreground border border-border/70 hover:bg-muted hover:border-border disabled:opacity-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !title.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  {saving
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Criando...</>
                    : <><Plus className="w-3.5 h-3.5" /> Criar Tarefa</>
                  }
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(modal, document.body)
    : null;
}