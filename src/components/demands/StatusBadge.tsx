'use client';
import { Status } from '@/types';
import { STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.Pendente;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border border-current/10 shadow-sm shrink-0',
        colors.bg,
        colors.text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', colors.dot)} />
      {status}
    </span>
  );
}
