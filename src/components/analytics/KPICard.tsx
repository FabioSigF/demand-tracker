'use client';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  iconColorClass?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  description,
  iconColorClass = 'text-violet-500 bg-violet-600/10',
  className,
}: KPICardProps) {
  return (
    <div className={cn('bg-card border border-border rounded-2xl p-5 flex items-start justify-between shadow-sm', className)}>
      <div className="space-y-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </div>
        {description && (
          <p className="text-[11px] text-muted-foreground font-medium">
            {description}
          </p>
        )}
      </div>

      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm', iconColorClass)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
