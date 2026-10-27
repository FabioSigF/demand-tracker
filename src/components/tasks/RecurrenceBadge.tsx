'use client';
import { Repeat } from 'lucide-react';
import { TaskRecurrence } from '@/types/index';
import { TASK_RECURRENCE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface RecurrenceBadgeProps {
  recurrence?: TaskRecurrence;
  className?: string;
}

/** Ícone discreto indicando que a tarefa se repete; não renderiza nada se não for recorrente */
export function RecurrenceBadge({ recurrence, className }: RecurrenceBadgeProps) {
  if (!recurrence || recurrence === 'none') return null;
  const label = TASK_RECURRENCE_LABELS[recurrence];
  return (
    <span
      title={`Recorrente: ${label}`}
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-500 text-[10px] font-semibold shrink-0',
        className
      )}
    >
      <Repeat className="w-3 h-3" />
      {label}
    </span>
  );
}
