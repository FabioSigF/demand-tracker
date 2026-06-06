'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Demand, Operation, Status } from '@/types';
import { OPERATIONS, STATUSES } from '@/lib/constants';
import { TiptapEditor } from '../editor/TiptapEditor';
import { X, Calendar, AlertCircle, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import { formatDateShort, fromTimestamp, toTimestamp } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';

interface DemandDrawerProps {
  demand: Demand | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Omit<Demand, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
}

export function DemandDrawer({ demand, isOpen, onClose, onUpdate }: DemandDrawerProps) {
  const [task, setTask] = useState('');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState('');
  const [operation, setOperation] = useState<Operation>('Outro');
  const [status, setStatus] = useState<Status>('Pendente');
  const [startDateStr, setStartDateStr] = useState('');
  const [deadlineStr, setDeadlineStr] = useState('');
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Debounced changes
  const [debouncedNotes] = useDebounce(notes, 2000);
  const [debouncedHistory] = useDebounce(history, 2000);
  const [debouncedTask] = useDebounce(task, 2000);

  // Refs de controle
  const initializedDemandIdRef = useRef<string | null>(null);
  const savedValuesRef = useRef({ task: '', notes: '', history: '' });
  const isInitializingRef = useRef(false);

  // Sync state with open demand
  useEffect(() => {
    if (!demand || !isOpen) return;

    if (initializedDemandIdRef.current === demand.id) return;

    isInitializingRef.current = true;

    setTask(demand.task || '');
    setNotes(demand.notes || '');
    setHistory(demand.history || '');
    setOperation(demand.operation);
    setStatus(demand.status);
    setStartDateStr(
      demand.startDate
        ? fromTimestamp(demand.startDate).toISOString().split('T')[0]
        : ''
    );
    setDeadlineStr(
      demand.deadline
        ? fromTimestamp(demand.deadline).toISOString().split('T')[0]
        : ''
    );
    setSavingStatus('idle');

    savedValuesRef.current = {
      task: demand.task || '',
      notes: demand.notes || '',
      history: demand.history || '',
    };

    initializedDemandIdRef.current = demand.id;

    queueMicrotask(() => {
      isInitializingRef.current = false;
    });
  }, [demand, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      initializedDemandIdRef.current = null;
    }
  }, [isOpen]);

  const saveNow = useCallback(async () => {
    if (!demand) return;

    setSavingStatus('saving');

    await onUpdate(demand.id, {
      task,
      notes,
      history,
    });

    savedValuesRef.current = {
      task,
      notes,
      history,
    };

    setSavingStatus('saved');
  }, [demand, task, notes, history, onUpdate]);

  const runAutosave = useCallback(async () => {
    if (isInitializingRef.current) return;
    if (!demand || !isOpen) return;

    const taskChanged = debouncedTask !== savedValuesRef.current.task;
    const notesChanged = debouncedNotes !== savedValuesRef.current.notes;
    const historyChanged = debouncedHistory !== savedValuesRef.current.history;

    if (!taskChanged && !notesChanged && !historyChanged) return;

    setSavingStatus('saving');
    try {
      await onUpdate(demand.id, {
        task: debouncedTask,
        notes: debouncedNotes,
        history: debouncedHistory,
      });
      savedValuesRef.current = {
        task: debouncedTask,
        notes: debouncedNotes,
        history: debouncedHistory,
      };

      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch {
      setSavingStatus('idle');
      toast.error('Falha ao salvar alterações automáticas');
    }
  }, [debouncedTask, debouncedNotes, debouncedHistory, demand, isOpen, onUpdate]);

  useEffect(() => {
    runAutosave();
  }, [runAutosave]);

  if (!isOpen || !demand) return null;

  const handleFieldChange = async (fields: Partial<Omit<Demand, 'id' | 'userId' | 'createdAt'>>) => {
    try {
      setSavingStatus('saving');
      await onUpdate(demand.id, fields);
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch {
      setSavingStatus('idle');
      toast.error('Erro ao atualizar campo');
    }
  };

  const handleDateChange = (type: 'startDate' | 'deadline', dateStr: string) => {
    if (!dateStr) return;
    const date = new Date(dateStr + 'T12:00:00'); // set mid-day to avoid TZ shifts
    const ts = toTimestamp(date);

    if (type === 'startDate') {
      setStartDateStr(dateStr);
      handleFieldChange({ startDate: ts });
    } else {
      setDeadlineStr(dateStr);
      handleFieldChange({ deadline: ts });
    }
  };

  const handleClose = async () => {
    await saveNow();
    onClose();
  };

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
            <span className="text-lg font-mono font-bold text-violet-500">
              {demand.demandId || '#----'}
            </span>
            <span className="text-xs text-muted-foreground">• Detalhes da Demanda</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Saving indicator */}
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
              onChange={(e) => setTask(e.target.value)}
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
                {OPERATIONS.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
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
                {STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
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
              onChange={(e) => setNotes(e.target.value)}
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
              onChange={(val) => setHistory(val)}
            />
          </div>

        </div>
      </div>
    </>
  );
}
