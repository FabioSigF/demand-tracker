'use client';
import { useOperations } from '@/hooks/useOperations';
import { getOperationColor } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface OperationBadgeProps {
  operation: string;
  className?: string;
}

export function OperationBadge({ operation, className }: OperationBadgeProps) {
  const { operations } = useOperations();
  const op = operations.find(o => o.name.toLowerCase() === operation.toLowerCase());
  const colors = getOperationColor(operation, op?.color);
  
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
      {operation}
    </span>
  );
}
