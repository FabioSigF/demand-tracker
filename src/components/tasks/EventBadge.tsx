'use client';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Fundo e faixa lateral verdes que destacam eventos em listas e tabelas */
export const EVENT_ROW_CLASSES = 'bg-green-500/[0.07] hover:bg-green-500/[0.12]';
export const EVENT_ACCENT_CLASSES = 'border-l-4 border-l-green-500';

export function EventBadge({ className }: { className?: string }) {
  return (
    <span
      title="Evento"
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500/15 text-green-600 dark:text-green-400 text-[10px] font-semibold shrink-0',
        className
      )}
    >
      <CalendarClock className="w-3 h-3" />
      Evento
    </span>
  );
}
