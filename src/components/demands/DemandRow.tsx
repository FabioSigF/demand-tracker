'use client';
import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Demand, Operation, Status } from '@/types';
import { OPERATIONS, STATUSES } from '@/lib/constants';
import { OperationBadge } from './OperationBadge';
import { StatusBadge } from './StatusBadge';
import { DelayedBadge } from './DelayedBadge';
import { TimerControls } from '../timer/TimerControls';
import { GripVertical, Trash2, Eye, Calendar, AlertCircle } from 'lucide-react';
import { fromTimestamp, toTimestamp, formatDateShort } from '@/lib/utils';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';
import { useConfirm } from '@/contexts/ConfirmModalContext';

interface DemandRowProps {
  demand: Demand;
  onUpdate: (id: string, data: Partial<Omit<Demand, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenDetails: (demand: Demand) => void;
  onStopTimerClick: (seconds: number, stopFn: (finalSeconds: number) => Promise<number>) => void;
  isDragEnabled: boolean;
}

export function DemandRow({
  demand,
  onUpdate,
  onDelete,
  onOpenDetails,
  onStopTimerClick,
  isDragEnabled,
}: DemandRowProps) {

  const { confirm } = useConfirm();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: demand.id, disabled: !isDragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : 'auto',
  };

  const [demandId, setDemandId] = useState(demand.demandId || '');
  const [task, setTask] = useState(demand.task || '');
  const [notes, setNotes] = useState(demand.notes || '');

  // Debounces for text fields
  const [debouncedDemandId] = useDebounce(demandId, 1500);
  const [debouncedTask] = useDebounce(task, 2000);
  const [debouncedNotes] = useDebounce(notes, 2000);

  // Sync state with upstream document updates (e.g. from Drawer or another client)
  useEffect(() => {
    setDemandId(demand.demandId || '');
  }, [demand.demandId]);

  useEffect(() => {
    setTask(demand.task || '');
  }, [demand.task]);

  useEffect(() => {
    setNotes(demand.notes || '');
  }, [demand.notes]);

  // Autosave triggers
  useEffect(() => {
    if (debouncedDemandId !== demand.demandId) {
      if (debouncedDemandId.length <= 6) {
        onUpdate(demand.id, { demandId: debouncedDemandId }).catch(() => {
          toast.error('Erro ao salvar ID da demanda');
        });
      }
    }
  }, [debouncedDemandId, demand.demandId, demand.id, onUpdate]);

  useEffect(() => {
    if (debouncedTask !== demand.task) {
      onUpdate(demand.id, { task: debouncedTask }).catch(() => {
        toast.error('Erro ao salvar tarefa');
      });
    }
  }, [debouncedTask, demand.task, demand.id, onUpdate]);

  useEffect(() => {
    if (debouncedNotes !== demand.notes) {
      onUpdate(demand.id, { notes: debouncedNotes }).catch(() => {
        toast.error('Erro ao salvar anotações');
      });
    }
  }, [debouncedNotes, demand.notes, demand.id, onUpdate]);

  const handleSelectChange = <T extends string>(field: 'operation' | 'status', value: T) => {
    onUpdate(demand.id, { [field]: value }).then(() => {
      toast.success(`${field === 'status' ? 'Status' : 'Operação'} atualizada`);
    }).catch(() => {
      toast.error('Erro ao atualizar campo');
    });
  };

  const handleDateChange = (field: 'startDate' | 'deadline', e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return;
    const date = new Date(value + 'T12:00:00'); // avoid timezone offset issues
    onUpdate(demand.id, { [field]: toTimestamp(date) }).catch(() => {
      toast.error('Erro ao salvar data');
    });
  };

  const handleDeleteRequest = async () => {
    const confirmed = await confirm({
      title: 'Excluir demanda',
      description: 'Esta ação não poderá ser desfeita. Deseja realmente excluir esta demanda?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      await onDelete(demand.id);
      toast.success('Demanda excluída');
    } catch {
      toast.error('Erro ao excluir demanda');
    }
  };

  const startDateInputVal = demand.startDate
    ? fromTimestamp(demand.startDate).toISOString().split('T')[0]
    : '';

  const deadlineInputVal = demand.deadline
    ? fromTimestamp(demand.deadline).toISOString().split('T')[0]
    : '';

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-border/60 hover:bg-muted/15 transition-all text-sm group"
    >
      {/* Drag Handle */}
      <td className="p-2 w-8 text-center">
        {isDragEnabled ? (
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing hover:bg-muted transition shrink-0"
            title="Arrastar para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-6" />
        )}
      </td>

      {/* ID */}
      <td className="p-2 w-24">
        <input
          type="text"
          value={demandId}
          maxLength={6}
          onChange={(e) => setDemandId(e.target.value)}
          placeholder="#1234"
          className="w-full bg-transparent font-mono font-bold text-violet-500 border border-transparent hover:border-border/60 focus:border-primary rounded px-1 py-0.5 focus:outline-none focus:bg-background transition"
        />
      </td>

      {/* Operation */}
      <td className="p-2 w-36">
        <div className="relative">
          <select
            value={demand.operation}
            onChange={(e) => handleSelectChange('operation', e.target.value as Operation)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            {OPERATIONS.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
          <div className="pointer-events-none">
            <OperationBadge operation={demand.operation} />
          </div>
        </div>
      </td>

      {/* Task */}
      <td className="p-2 min-w-[200px]">
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={task}
            maxLength={200}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Descreva a tarefa..."
            className="w-full bg-transparent font-medium border border-transparent hover:border-border/60 focus:border-primary rounded px-1.5 py-0.5 focus:outline-none focus:bg-background transition text-foreground"
          />
          <div className="flex flex-wrap items-center gap-1.5 px-1.5">
            <DelayedBadge deadline={demand.deadline} status={demand.status} />
          </div>
        </div>
      </td>

      {/* Start Date */}
      <td className="p-2 w-28">
        <div className="relative flex items-center gap-1 bg-transparent hover:bg-muted/30 border border-transparent hover:border-border/60 focus-within:border-primary rounded px-1.5 py-0.5 transition group/date">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-xs text-foreground font-semibold tabular-nums">
            {demand.startDate ? formatDateShort(demand.startDate) : '--/--'}
          </span>
          <input
            type="date"
            value={startDateInputVal}
            onChange={(e) => handleDateChange('startDate', e)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </td>

      {/* Deadline */}
      <td className="p-2 w-28">
        <div className="relative flex items-center gap-1 bg-transparent hover:bg-muted/30 border border-transparent hover:border-border/60 focus-within:border-primary rounded px-1.5 py-0.5 transition group/date">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-xs text-foreground font-semibold tabular-nums">
            {demand.deadline ? formatDateShort(demand.deadline) : '--/--'}
          </span>
          <input
            type="date"
            value={deadlineInputVal}
            onChange={(e) => handleDateChange('deadline', e)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </td>

      {/* Status */}
      <td className="p-2 w-36">
        <div className="relative">
          <select
            value={demand.status}
            onChange={(e) => handleSelectChange('status', e.target.value as Status)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            {STATUSES.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
          <div className="pointer-events-none">
            <StatusBadge status={demand.status} />
          </div>
        </div>
      </td>

      {/* Quick Notes */}
      <td className="p-2 min-w-[150px]">
        <textarea
          rows={1}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotações rápidas..."
          className="w-full bg-transparent border border-transparent hover:border-border/60 focus:border-primary rounded px-1.5 py-0.5 focus:outline-none focus:bg-background transition text-xs text-muted-foreground hover:text-foreground focus:text-foreground resize-none"
        />
      </td>

      {/* Timer Controls */}
      <td className="p-2 w-44">
        <TimerControls
          demandId={demand.id}
          operation={demand.operation}
          onStopClick={onStopTimerClick}
        />
      </td>

      {/* Actions */}
      <td className="p-2 w-20 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            onClick={() => onOpenDetails(demand)}
            title="Abrir detalhes"
            className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition shrink-0"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteRequest}
            title="Excluir demanda"
            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
