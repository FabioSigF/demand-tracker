'use client';
import { useOperations } from '@/hooks/useOperations';
import { Search, X, Calendar } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface TaskFilterState {
  search: string;
  operation: string;
  startDate?: string;
  endDate?: string;
}

interface TaskFiltersProps {
  filters: TaskFilterState;
  onChange: (filters: TaskFilterState) => void;
}

export function TaskFilters({ filters, onChange }: TaskFiltersProps) {
  const { operations } = useOperations();
  const [showDates, setShowDates] = useState(false);

  const handleUpdate = (updates: Partial<TaskFilterState>) => {
    onChange({ ...filters, ...updates });
  };

  const handleClear = () => {
    onChange({ search: '', operation: 'Todos', startDate: undefined, endDate: undefined });
    setShowDates(false);
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.operation !== 'Todos' ||
    filters.startDate !== undefined ||
    filters.endDate !== undefined;

  const hasDates = filters.startDate !== undefined || filters.endDate !== undefined;

  return (
    <div className="flex flex-col gap-3 p-4 bg-card border border-border rounded-xl mb-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">

        {/* Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleUpdate({ search: e.target.value })}
            placeholder="Pesquisar por título, demanda, operação..."
            className="w-full bg-muted/40 hover:bg-muted focus:bg-background border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
          />
        </div>

        {/* Operação */}
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground font-medium">Operação:</span>
          <select
            value={filters.operation}
            onChange={(e) => handleUpdate({ operation: e.target.value })}
            className="bg-muted/40 hover:bg-muted border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition font-medium"
          >
             <option value="Todos">Todas</option>
             {operations.map(op => (
               <option key={op.id} value={op.name}>{op.name}</option>
             ))}
          </select>
        </div>

        {/* Botão datas */}
        <button
          onClick={() => setShowDates(v => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition shadow-sm',
            showDates || hasDates
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <Calendar className="w-4 h-4" />
          Datas
          {hasDates && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          )}
        </button>

        {/* Limpar */}
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg border border-border/80 hover:border-destructive/20 transition"
          >
            <X className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>

      {/* Datas expansíveis */}
      {showDates && (
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/60 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-medium">De:</span>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleUpdate({ startDate: e.target.value || undefined })}
              className="bg-muted/40 hover:bg-muted border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition text-foreground"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-medium">Até:</span>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleUpdate({ endDate: e.target.value || undefined })}
              className="bg-muted/40 hover:bg-muted border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition text-foreground"
            />
          </div>
          {hasDates && (
            <button
              onClick={() => handleUpdate({ startDate: undefined, endDate: undefined })}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition"
            >
              <X className="w-3.5 h-3.5" />
              Limpar datas
            </button>
          )}
        </div>
      )}
    </div>
  );
}