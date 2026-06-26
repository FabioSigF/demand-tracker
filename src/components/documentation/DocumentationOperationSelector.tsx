'use client';
import { useOperations } from '@/hooks/useOperations';
import { getOperationColor } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface DocumentationOperationSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

export function DocumentationOperationSelector({
  selectedIds,
  onChange,
  className,
}: DocumentationOperationSelectorProps) {
  const { operations, loading } = useOperations();

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2 animate-pulse">
        {[1, 2, 3].map(n => (
          <div key={n} className="h-8 w-20 bg-muted rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {operations.map(op => {
        const isSelected = selectedIds.includes(op.id);
        const colors = getOperationColor(op.name, op.color);

        return (
          <button
            key={op.id}
            type="button"
            onClick={() => handleToggle(op.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 active:scale-95",
              isSelected
                ? cn(colors.bg, colors.text, "border-current shadow-sm scale-[1.02]")
                : "bg-muted/30 dark:bg-muted/10 text-muted-foreground border-border/80 hover:bg-muted/60 dark:hover:bg-muted/20"
            )}
          >
            {isSelected && <Check className="w-3.5 h-3.5" />}
            <span>{op.name}</span>
          </button>
        );
      })}
      {operations.length === 0 && (
        <span className="text-xs text-muted-foreground italic">
          Nenhuma operação cadastrada nas configurações.
        </span>
      )}
    </div>
  );
}
