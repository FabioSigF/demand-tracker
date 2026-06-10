'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Task, TaskStatus } from '@/types/index';
import { X, Calendar, FileText, RefreshCw, CheckCircle } from 'lucide-react';
import { fromTimestamp, toTimestamp } from '@/lib/utils';
import { toast } from 'sonner';
import { OperationBadge } from '../demands/OperationBadge';

// Os 4 status possíveis de uma tarefa
const TASK_STATUSES: TaskStatus[] = ['Pendente', 'Em andamento', 'Cancelado', 'Concluída'];

const STATUS_STYLES: Record<TaskStatus, string> = {
  'Pendente':     'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  'Em andamento': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'Cancelado':    'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  'Concluída':    'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
};

interface TaskDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  onOpenDemand?: (demandId: string) => void;
}

type TextFields = { title: string; description: string };

export function TaskDrawer({ task, isOpen, onClose, onUpdate, onOpenDemand }: TaskDrawerProps) {
  // ── Estado de UI ──────────────────────────────────────────────────────────
  const [title,        setTitle]        = useState('');
  const [description,  setDescription]  = useState('');
  const [status,       setStatus]       = useState<TaskStatus>('Pendente');
  const [dueDateStr,   setDueDateStr]   = useState('');
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // ── Refs estáticos ────────────────────────────────────────────────────────
  const taskIdRef        = useRef<string | null>(null);
  const onUpdateRef      = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; });
  const onCloseRef       = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  const pendingRef       = useRef<TextFields>({ title: '', description: '' });
  const savedRef         = useRef<TextFields>({ title: '', description: '' });
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
    return p.title !== s.title || p.description !== s.description;
  };

  // ── saveNow: deps=[] estável ──────────────────────────────────────────────
  const saveNow = useCallback(async (): Promise<boolean> => {
    const id = taskIdRef.current;
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
    } catch {
      setSavingStatus('idle');
      throw new Error('save_failed');
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  const scheduleAutosave = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(async () => {
      try { await saveNow(); }
      catch { toast.error('Falha ao salvar alterações automáticas'); }
    }, 2000);
  }, []);

  const handleClose = useCallback(async () => {
    clearTimer();
    if (hasPendingChanges()) {
      try { await saveNow(); }
      catch { toast.error('Algumas alterações podem não ter sido salvas'); }
    }
    onCloseRef.current();
  }, []);

  // handleFieldChange — save imediato para campos sem debounce
  const handleFieldChange = useCallback(async (
    fields: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>
  ) => {
    const id = taskIdRef.current;
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

  // ── Inicialização — só quando task.id muda ou drawer abre ─────────────────
  useEffect(() => {
    if (!task || !isOpen) return;
    if (initializedIdRef.current === task.id) return;

    clearTimer();

    const textValues: TextFields = {
      title:       task.title       || '',
      description: task.description || '',
    };

    setTitle(textValues.title);
    setDescription(textValues.description);
    setStatus(task.status);
    setDueDateStr(task.dueDate ? fromTimestamp(task.dueDate).toISOString().split('T')[0] : '');
    setSavingStatus('idle');

    pendingRef.current = { ...textValues };
    savedRef.current   = { ...textValues };
    taskIdRef.current        = task.id;
    initializedIdRef.current = task.id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, isOpen]);

  // Reseta guard ao fechar
  useEffect(() => {
    if (!isOpen) {
      initializedIdRef.current = null;
      taskIdRef.current = null;
    }
  }, [isOpen]);

  // Sincroniza campos não-texto com o objeto vivo do Firestore
  useEffect(() => {
    if (!task || !isOpen) return;
    if (initializedIdRef.current !== task.id) return;
    setStatus(task.status);
    setDueDateStr(task.dueDate ? fromTimestamp(task.dueDate).toISOString().split('T')[0] : '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.status, task?.dueDate]);

  // Sincroniza campos de texto vivos (editados externamente, ex: DemandTasksSection)
  useEffect(() => {
    if (!task || !isOpen) return;
    if (initializedIdRef.current !== task.id) return;
    // Só atualiza se o usuário não tiver alterações pendentes nesse campo
    if (task.title !== savedRef.current.title && task.title !== pendingRef.current.title) {
      setTitle(task.title || '');
      pendingRef.current.title = task.title || '';
      savedRef.current.title   = task.title || '';
    }
    if (task.description !== savedRef.current.description && task.description !== pendingRef.current.description) {
      setDescription(task.description || '');
      pendingRef.current.description = task.description || '';
      savedRef.current.description   = task.description || '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.title, task?.description]);

  useEffect(() => () => clearTimer(), []);

  if (!isOpen || !task) return null;

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
            <OperationBadge operation={task.operation} />
            <span className="text-xs text-muted-foreground">• Detalhes da Tarefa</span>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Demanda vinculada */}
          <div className="bg-muted/20 border border-border/50 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Demanda vinculada
            </p>
            <button
              onClick={() => onOpenDemand?.(task.demandId)}
              className="text-sm font-semibold text-violet-500 hover:text-violet-400 hover:underline block text-left truncate max-w-full transition"
            >
              {task.demandTitle || 'Sem título'}
            </button>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {task.demandId || '—'}
            </p>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Título da Tarefa
            </label>
            <input
              type="text"
              value={title}
              maxLength={200}
              onChange={(e) => {
                const value = e.target.value;
                setTitle(value);
                pendingRef.current.title = value;
                scheduleAutosave();
              }}
              placeholder="Descreva a tarefa..."
              className="w-full bg-transparent text-lg font-bold text-foreground border-b border-transparent hover:border-border/60 focus:border-primary pb-1 focus:outline-none transition"
            />
          </div>

          {/* Config grid */}
          <div className="grid grid-cols-2 gap-4 bg-muted/20 border border-border/50 p-4 rounded-xl">

            {/* Status — select com 4 opções */}
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value as TaskStatus;
                  setStatus(val);
                  handleFieldChange({ status: val });
                }}
                className={`
                  w-full border rounded-lg px-2.5 py-1.5 text-sm font-semibold
                  focus:outline-none focus:ring-2 focus:ring-primary transition
                  ${STATUS_STYLES[status]}
                `}
              >
                {TASK_STATUSES.map(s => (
                  <option key={s} value={s} className="bg-background text-foreground font-normal">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Prazo
              </label>
              <input
                type="date"
                value={dueDateStr}
                onChange={(e) => {
                  const val = e.target.value;
                  setDueDateStr(val);
                  if (val) {
                    handleFieldChange({ dueDate: toTimestamp(new Date(val + 'T12:00:00')) });
                  }
                }}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium text-foreground"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2 pb-6">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                const value = e.target.value;
                setDescription(value);
                pendingRef.current.description = value;
                scheduleAutosave();
              }}
              placeholder="Descreva os detalhes desta tarefa..."
              className="w-full bg-muted/20 border border-border/80 rounded-xl p-3 text-sm text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition resize-y min-h-[120px]"
            />
          </div>

        </div>
      </div>
    </>
  );
}