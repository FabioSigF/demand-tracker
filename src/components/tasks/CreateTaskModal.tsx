'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useDemands } from '@/hooks/useDemands';
import { createTaskForDemands } from '@/services/tasks.service';
import { useAuthContext } from '@/contexts/AuthContext';
import { Demand, TaskRecurrence, TaskType } from '@/types';
import { DONE_STATUSES, TASK_RECURRENCE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Search, X, Plus, RefreshCw, ChevronRight, Check, Calendar, Repeat, Clock, ListTodo, CalendarClock } from 'lucide-react';
import { OperationBadge } from '../demands/OperationBadge';
import { toast } from 'sonner';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  /** Se fornecido, pré-seleciona a demanda e não mostra o passo de busca */
  preselectedDemand?: Demand | null;
}

const todayStr = () => format(new Date(), 'yyyy-MM-dd');
// Próxima hora cheia, sugestão padrão para eventos (após 23h cai no dia seguinte)
const nextHour = () => new Date(Date.now() + 60 * 60 * 1000);
const nextHourStr = () => format(nextHour(), 'HH:00');

export function CreateTaskModal({ open, onClose, preselectedDemand }: CreateTaskModalProps) {
  const { user } = useAuthContext();
  const { demands } = useDemands();

  // ── Passos: 'demand' → 'task' ─────────────────────────────────────────────
  const [step, setStep] = useState<'demand' | 'task'>(
    preselectedDemand ? 'task' : 'demand'
  );

  const [search,          setSearch]          = useState('');
  const [selectedDemands, setSelectedDemands] = useState<Demand[]>(preselectedDemand ? [preselectedDemand] : []);
  const [title,           setTitle]           = useState('');
  const [description,     setDescription]     = useState('');
  const [priority,        setPriority]        = useState<number>(0);
  const [dueDateStr,      setDueDateStr]      = useState(todayStr);
  const [recurrence,      setRecurrence]      = useState<TaskRecurrence>('none');
  const [kind,            setKind]            = useState<TaskType>('task');
  const [eventTimeStr,    setEventTimeStr]    = useState(nextHourStr);
  const [saving,          setSaving]          = useState(false);

  const isEvent = kind === 'event';

  const titleInputRef = useRef<HTMLInputElement>(null);
  const overlayRef    = useRef<HTMLDivElement>(null);

  // Reset ao abrir
  useEffect(() => {
    if (!open) return;
    if (preselectedDemand) {
      setStep('task');
      setSelectedDemands([preselectedDemand]);
    } else {
      setStep('demand');
      setSelectedDemands([]);
    }
    setSearch('');
    setTitle('');
    setDescription('');
    setPriority(0);
    setDueDateStr(todayStr());
    setRecurrence('none');
    setKind('task');
    setEventTimeStr(nextHourStr());
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
    .filter(d => !DONE_STATUSES.includes(d.status))
    .filter(d => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        d.task.toLowerCase().includes(s) ||
        d.demandId.toLowerCase().includes(s) ||
        d.operation.toLowerCase().includes(s)
      );
    });

  const isSelected = (demand: Demand) => selectedDemands.some(d => d.id === demand.id);

  const toggleDemand = (demand: Demand) => {
    setSelectedDemands(prev =>
      prev.some(d => d.id === demand.id)
        ? prev.filter(d => d.id !== demand.id)
        : [...prev, demand]
    );
  };

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Informe um título para a tarefa'); return; }
    if (!isEvent && selectedDemands.length === 0) { toast.error('Selecione ao menos uma demanda'); return; }
    if (isEvent && (!dueDateStr || !eventTimeStr)) { toast.error('Informe a data e a hora do evento'); return; }
    if (!user) return;

    // Evento guarda data + hora; tarefa guarda só o dia (meio-dia evita virar o dia por fuso)
    const dueDate = dueDateStr
      ? Timestamp.fromDate(new Date(`${dueDateStr}T${isEvent ? eventTimeStr : '12:00'}:00`))
      : undefined;

    setSaving(true);
    try {
      await createTaskForDemands(
        {
          userId:      user.uid,
          title:       title.trim(),
          description: description.trim(),
          priority:    isEvent ? 0 : priority,
          recurrence,
          type:        kind,
          dueDate,
        },
        selectedDemands.map(d => ({
          demandId:    d.id,
          demandTitle: d.task || '',
          operation:   d.operation,
        }))
      );
      const created = isEvent ? 'Evento criado' : 'Tarefa criada';
      toast.success(
        selectedDemands.length > 1
          ? `${created} em ${selectedDemands.length} demandas`
          : created
      );
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
                  title="Voltar para a seleção de demandas"
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              )}
              <h2 className="text-sm font-semibold text-foreground">
                {isEvent ? 'Novo Evento' : 'Nova Tarefa'}
              </h2>
            </div>
            <div className="flex items-center bg-muted/40 border border-border rounded-lg p-0.5 ml-auto mr-2" role="group" aria-label="Tipo">
              {([
                { value: 'task',  label: 'Tarefa', icon: ListTodo },
                { value: 'event', label: 'Evento', icon: CalendarClock },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setKind(opt.value);
                    // Mantém data e hora sugeridas coerentes quando a próxima hora já é amanhã
                    if (opt.value === 'event' && dueDateStr === todayStr()) {
                      setDueDateStr(format(nextHour(), 'yyyy-MM-dd'));
                      setEventTimeStr(nextHourStr());
                    }
                  }}
                  aria-pressed={kind === opt.value}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition',
                    kind === opt.value
                      ? opt.value === 'event'
                        ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                        : 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Passo 1: selecionar uma ou mais demandas ── */}
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
                <p className="text-[11px] text-muted-foreground mt-2">
                  {isEvent
                    ? 'Vincule o evento a uma ou mais demandas, ou continue sem demanda.'
                    : 'Selecione uma ou mais demandas. Uma tarefa será criada em cada uma.'}
                </p>
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-y-auto px-2 pb-3 min-h-0 space-y-0.5">
                {filteredDemands.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 italic">
                    {search ? 'Nenhuma demanda encontrada.' : 'Nenhuma demanda ativa.'}
                  </p>
                ) : (
                  filteredDemands.map(demand => {
                    const checked = isSelected(demand);
                    return (
                      <button
                        key={demand.id}
                        onClick={() => toggleDemand(demand)}
                        aria-pressed={checked}
                        className={cn(
                          'w-full flex items-start gap-3 px-3 py-2.5 rounded-xl transition text-left group',
                          checked ? 'bg-violet-500/10' : 'hover:bg-muted/40'
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition',
                            checked
                              ? 'bg-violet-600 border-violet-600 text-white'
                              : 'border-border group-hover:border-muted-foreground'
                          )}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </span>
                        <div className="shrink-0">
                          <OperationBadge operation={demand.operation} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {demand.task || <span className="italic text-muted-foreground">Sem título</span>}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {demand.demandId || '—'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border/60 shrink-0 flex items-center justify-between gap-2.5">
                <span className="text-xs text-muted-foreground">
                  {selectedDemands.length === 0
                    ? 'Nenhuma selecionada'
                    : `${selectedDemands.length} selecionada${selectedDemands.length > 1 ? 's' : ''}`}
                </span>
                <button
                  onClick={() => setStep('task')}
                  disabled={!isEvent && selectedDemands.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  {isEvent && selectedDemands.length === 0 ? 'Continuar sem demanda' : 'Continuar'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Passo 2: preencher tarefa ── */}
          {step === 'task' && (selectedDemands.length > 0 || isEvent) && (
            <div className="flex flex-col min-h-0 flex-1">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">

                {/* Demandas selecionadas */}
                {selectedDemands.length === 0 ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2.5 text-xs text-green-700 dark:text-green-300">
                    Evento avulso, sem demanda vinculada.
                  </div>
                ) : (
                <div className="bg-muted/30 border border-border/60 rounded-xl px-3 py-2.5 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {selectedDemands.length > 1
                      ? `Demandas vinculadas (${selectedDemands.length})`
                      : 'Demanda vinculada'}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {selectedDemands.map(d => (
                      <div key={d.id} className="flex items-center gap-2 min-w-0">
                        <OperationBadge operation={d.operation} />
                        <span className="text-sm font-semibold text-foreground truncate flex-1">
                          {d.task || 'Sem título'}
                        </span>
                        {selectedDemands.length > 1 && !preselectedDemand && (
                          <button
                            onClick={() => toggleDemand(d)}
                            title="Remover desta seleção"
                            className="p-0.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* Título */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {isEvent ? 'Título do Evento' : 'Título da Tarefa'} <span className="text-destructive">*</span>
                  </label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    maxLength={200}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleCreate(); }}
                    placeholder={isEvent ? 'Ex.: Reunião de alinhamento com o cliente' : 'O que precisa ser feito?'}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Prazo / data do evento */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {isEvent ? 'Data' : 'Prazo'}
                    </label>
                    <input
                      type="date"
                      value={dueDateStr}
                      onChange={e => setDueDateStr(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition"
                    />
                  </div>

                  {isEvent && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Hora
                      </label>
                      <input
                        type="time"
                        value={eventTimeStr}
                        onChange={e => setEventTimeStr(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition"
                      />
                    </div>
                  )}

                  {/* Recorrência — linha própria no evento (data + hora ocupam a primeira) */}
                  <div className={cn('space-y-1.5', isEvent && 'col-span-2')}>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Repeat className="w-3 h-3" />
                      Repetir
                    </label>
                    <select
                      value={recurrence}
                      onChange={e => setRecurrence(e.target.value as TaskRecurrence)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition"
                    >
                      {TASK_RECURRENCE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {recurrence !== 'none' && (
                  <p className="text-[11px] text-muted-foreground -mt-2">
                    Ao concluir, a próxima ocorrência é criada automaticamente com o prazo seguinte.
                  </p>
                )}

                {/* Prioridade — eventos são ordenados por data/hora */}
                {!isEvent && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Prioridade
                    </label>
                    <span className="text-[10px] text-muted-foreground">Padrão: 0 (maior = topo)</span>
                  </div>
                  <input
                    type="number"
                    value={priority}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      setPriority(isNaN(val) ? 0 : val);
                    }}
                    placeholder="0"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition font-semibold"
                  />
                </div>
                )}

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
                    : <><Plus className="w-3.5 h-3.5" /> {
                        selectedDemands.length > 1
                          ? `Criar ${selectedDemands.length} ${isEvent ? 'Eventos' : 'Tarefas'}`
                          : isEvent ? 'Criar Evento' : 'Criar Tarefa'
                      }</>
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
