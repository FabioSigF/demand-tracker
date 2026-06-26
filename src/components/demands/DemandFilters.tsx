'use client';
import { Status } from '@/types';
import { STATUSES } from '@/lib/constants';
import { useOperations } from '@/hooks/useOperations';
import { Search, X, Calendar, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface FilterState {
  search: string;
  operation: string;
  status: Status | 'Todos';
  onlyDelayed: boolean;
  startDate?: string;
  endDate?: string;
}

interface DemandFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  showStatusFilter?: boolean;
}

export function DemandFilters({ filters, onChange, showStatusFilter = true }: DemandFiltersProps) {
  const { operations } = useOperations();
  const [showDates, setShowDates] = useState(false);

  const handleUpdate = (updates: Partial<FilterState>) => {
    onChange({ ...filters, ...updates });
  };

  const handleClear = () => {
    onChange({
      search: '',
      operation: 'Todos',
      status: 'Todos',
      onlyDelayed: false,
      startDate: undefined,
      endDate: undefined,
    });
    setShowDates(false);
  };

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.operation !== 'Todos' ||
    filters.status !== 'Todos' ||
    filters.onlyDelayed ||
    filters.startDate !== undefined ||
    filters.endDate !== undefined;

  return (
    <div className="flex flex-col gap-3 p-4 bg-card border border-border rounded-xl mb-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleUpdate({ search: e.target.value })}
            placeholder="Pesquisar nesta tabela..."
            className="w-full bg-muted/40 hover:bg-muted focus:bg-background border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
          />
        </div>

        {/* Operation Filter */}
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

        {/* Status Filter (optional, since tabs divide Em Atendimento / Concluídos) */}
        {showStatusFilter && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground font-medium">Status:</span>
            <select
              value={filters.status}
              onChange={(e) => handleUpdate({ status: e.target.value as Status | 'Todos' })}
              className="bg-muted/40 hover:bg-muted border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition font-medium"
            >
              <option value="Todos">Todos</option>
              {STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        )}

        {/* Only Delayed Checkbox */}
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.onlyDelayed}
            onChange={(e) => handleUpdate({ onlyDelayed: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-muted/40 transition cursor-pointer"
          />
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Somente atrasadas
          </span>
        </label>

        {/* Date Filter Button */}
        <button
          onClick={() => setShowDates(!showDates)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition shadow-sm',
            showDates || filters.startDate || filters.endDate
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <Calendar className="w-4 h-4" />
          Datas
        </button>

        {/* Clear Filters */}
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

      {/* Expandable Date Fields */}
      {showDates && (
        <div className="flex flex-wrap items-center gap-4 py-2 border-t border-border/60 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">De:</span>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleUpdate({ startDate: e.target.value || undefined })}
              className="bg-muted/40 hover:bg-muted border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition text-foreground"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Até:</span>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleUpdate({ endDate: e.target.value || undefined })}
              className="bg-muted/40 hover:bg-muted border border-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition text-foreground"
            />
          </div>
        </div>
      )}
    </div>
  );
}
