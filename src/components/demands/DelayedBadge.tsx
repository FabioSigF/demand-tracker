'use client';
import { Timestamp } from 'firebase/firestore';
import { Status } from '@/types';
import { isDelayed } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface DelayedBadgeProps {
  deadline: Timestamp;
  status: Status;
}

export function DelayedBadge({ deadline, status }: DelayedBadgeProps) {
  const delayed = isDelayed(deadline, status);

  if (!delayed) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 animate-pulse">
      <AlertCircle className="w-3.5 h-3.5" />
      Atrasada
    </span>
  );
}
