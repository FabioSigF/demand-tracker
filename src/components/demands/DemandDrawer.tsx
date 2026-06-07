'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Demand, Operation, Status } from '@/types';
import { OPERATIONS, STATUSES } from '@/lib/constants';
import { TiptapEditor } from '../editor/TiptapEditor';
import { X, Calendar, AlertCircle, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import { fromTimestamp, toTimestamp } from '@/lib/utils';
import { toast } from 'sonner';

interface DemandDrawerProps {
  demand: Demand | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Omit<Demand, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
}

type TextFields = { task: string; notes: string; history: string };

export function DemandDrawer({ demand, isOpen, onClose, onUpdate }: DemandDrawerProps) {
  // ── Estado de UI ──────────────────────────────────────────────────────────
  const [demandId, setDemandId] = useState('');  // ← novo
  const [task,         setTask]         = useState('');
  const [notes,        setNotes]        = useState('');
  const [history,      setHistory]      = useState('');
  const [operation,    setOperation]    = useState<Operation>('Outro');
  const [status,       setStatus]       = useState<Status>('Pendente');
  const [startDateStr, setStartDateStr] = useState('');
  const [deadlineStr,  setDeadlineStr]  = useState('');
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // ── Refs estáticos ────────────────────────────────────────────────────────
  const demandIdRef    = useRef<string | null>(null);
  const onUpdateRef    = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; });
  const onCloseRef     = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  const pendingRef       = useRef<TextFields>({ task: '', notes: '', history: '' });
  const savedRef         = useRef<TextFields>({ task: '', notes: '', history: '' });
  const initializedIdRef = useRef<string | null>(null);
  const timerRef         = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef      = useRef(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const hasPendingChanges = (): boolean => {
    const p = pendingRef.current;
    const s = savedRef.current;
    return p.task !== s.task || p.notes !== s.notes || p.history !== s.history;
  };

  // ── saveNow ───────────────────────────────────────────────────────────────
  const saveNow = useCallback(async (): Promise<boolean> => {
    const id = demandIdRef.current;
    if (!id) return false;
    if (!hasPendingChanges()) return false;
    if (isSavingRef.current) return false;

    isSavingRef.current = true;
    setSavingStatus('saving');
    const snapshot = { ...pendingRef.current };

    try {
      await onUpdateRef.current(id, snapshot);
      savedRef.current = snapshot;
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
      return true;
    } catch (err) {
      setSavingStatus('idle');
      throw new Error('save_failed');
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  // ── scheduleAutosave ──────────────────────────────────────────────────────
  const scheduleAutosave = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(async () => {
      try { await saveNow(); }
      catch { toast.error('Falha ao salvar alterações automáticas'); }
    }, 2000);
  }, []);

  // ── handleClose ───────────────────────────────────────────────────────────
  const handleClose = useCallback(async () => {
    clearTimer();
    if (hasPendingChanges()) {
      try { await saveNow(); }
      catch { toast.error('Algumas alterações podem não ter sido salvas'); }
    }
    onCloseRef.current();
  }, []);

  // ── handleFieldChange — save imediato (campos não-texto) ──────────────────
  const handleFieldChange = useCallback(async (
    fields: Partial<Omit<Demand, 'id' | 'userId' | 'createdAt'>>
  ) => {
    const id = demandIdRef.current;
    if (!id) return;
    try {
      setSavingStatus('saving');
      await onUpdateRef.current(id, fields);
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch {
      setSavingStatus('idle');
      toast.error('Erro ao atualizar campo');
    }
  }, []);

  const handleDateChange = useCallback((type: 'startDate' | 'deadline', dateStr: string) => {
    if (!dateStr) return;
    const date = new Date(dateStr + 'T12:00:00');
    const ts = toTimestamp(date);
    if (type === 'startDate') { setStartDateStr(dateStr); handleFieldChange({ startDate: ts }); }
    else                      { setDeadlineStr(dateStr);  handleFieldChange({ deadline: ts }); }
  }, []);

  // ── Inicialização — só quando demand.id muda ou drawer abre ───────────────
  useEffect(() => {
    if (!demand || !isOpen) return;
    if (initializedIdRef.current === demand.id) return;

    clearTimer();

    const textValues: TextFields = {
      task:    demand.task    || '',
      notes:   demand.notes   || '',
      history: demand.history || '',
    };

    setDemandId(demand.demandId || '');  // ← inicializa demandId
    setTask(textValues.task);
    setNotes(textValues.notes);
    setHistory(textValues.history);
    setOperation(demand.operation);
    setStatus(demand.status);
    setStartDateStr(demand.startDate ? fromTimestamp(demand.startDate).toISOString().split('T')[0] : '');
    setDeadlineStr(demand.deadline   ? fromTimestamp(demand.deadline).toISOString().split('T')[0]   : '');
    setSavingStatus('idle');

    pendingRef.current = { ...textValues };
    savedRef.current   = { ...textValues };
    demandIdRef.current    = demand.id;
    initializedIdRef.current = demand.id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demand?.id, isOpen]);

  // Reseta guard ao fechar
  useEffect(() => {
    if (!isOpen) {
      initializedIdRef.current = null;
      demandIdRef.current = null;
    }
  }, [isOpen]);

  // Sincroniza campos não-texto com o objeto vivo (operação, status, datas)
  useEffect(() => {
    if (!demand || !isOpen) return;
    if (initializedIdRef.current !== demand.id) return;
    setOperation(demand.operation);
    setStatus(demand.status);
    setStartDateStr(demand.startDate ? fromTimestamp(demand.startDate).toISOString().split('T')[0] : '');
    setDeadlineStr(demand.deadline   ? fromTimestamp(demand.deadline).toISOString().split('T')[0]   : '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demand?.operation, demand?.status, demand?.startDate, demand?.deadline]);

  // Sincroniza demandId com o objeto vivo (pode ser editado pelo DemandRow)
  useEffect(() => {
    if (!demand || !isOpen) return;
    if (initializedIdRef.current !== demand.id) return;
    setDemandId(demand.demandId || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demand?.demandId]);

  // Limpa timer ao desmontar
  useEffect(() => () => clearTimer(), []);

  // ── Render guard ──────────────────────────────────────────────────────────
  if (!isOpen || !demand) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40 animate-in fade-in duration-200"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-popover border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {/* ── demandId editável ── */}
            <input
              type="text"
              value={demandId}
              maxLength={6}
              onChange={(e) => {
                const val = e.target.value;
                setDemandId(val);
                // Save imediato (campo curto, sem necessidade de debounce longo)
                handleFieldChange({ demandId: val });
              }}
              placeholder="#----"
              className="w-24 bg-transparent text-lg font-mono font-bold text-violet-500 border-b border-transparent hover:border-violet-400/60 focus:border-violet-500 focus:outline-none transition pb-0.5"
            />
            <span className="text-xs text-muted-foreground">• Detalhes da Demanda</span>
          </div>

          <div className="flex items-center gap-3">
            {savingStatus === 'saving' && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Salvando...
              </span>
            )}
            {savingStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Salvo
              </span>
            )}
            <button
              onClick={handleClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Task / Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tarefa (Título)
            </label>
            <input
              type="text"
              value={task}
              maxLength={200}
              onChange={(e) => {
                const value = e.target.value;
                setTask(value);
                pendingRef.current.task = value;
                scheduleAutosave();
              }}
              placeholder="Descreva a tarefa..."
              className="w-full bg-transparent text-lg font-bold text-foreground border-b border-transparent hover:border-border/60 focus:border-primary pb-1 focus:outline-none transition"
            />
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-2 gap-4 bg-muted/20 border border-border/50 p-4 rounded-xl">
            {/* Operation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Operação
              </label>
              <select
                value={operation}
                onChange={(e) => {
                  const val = e.target.value as Operation;
                  setOperation(val);
                  handleFieldChange({ operation: val });
                }}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              >
                {OPERATIONS.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value as Status;
                  setStatus(val);
                  handleFieldChange({ status: val });
                }}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              >
                {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Início
              </label>
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium text-foreground"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Prazo
              </label>
              <input
                type="date"
                value={deadlineStr}
                onChange={(e) => handleDateChange('deadline', e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium text-foreground"
              />
            </div>
          </div>

          {/* Quick Notes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Anotações Rápidas
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                const value = e.target.value;
                setNotes(value);
                pendingRef.current.notes = value;
                scheduleAutosave();
              }}
              placeholder="Digite notas rápidas sobre esta demanda..."
              className="w-full bg-muted/20 border border-border/80 rounded-xl p-3 text-sm text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition resize-y min-h-[80px]"
            />
          </div>

          {/* History Rich-Text */}
          <div className="space-y-2 pb-6">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              História / Descrição Detalhada
            </label>
            <TiptapEditor
              value={history}
              onChange={(value) => {
                setHistory(value);
                pendingRef.current.history = value;
                scheduleAutosave();
              }}
            />
          </div>

        </div>
      </div>
    </>
  );
}