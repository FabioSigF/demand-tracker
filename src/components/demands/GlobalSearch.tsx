'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { useDemands } from '@/hooks/useDemands';
import { Demand } from '@/types';
import { OperationBadge } from './OperationBadge';
import { StatusBadge } from './StatusBadge';
import { useDebounce } from 'use-debounce';

export function GlobalSearch() {
  const router = useRouter();
  const { demands, loading } = useDemands();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<Demand[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim() || !demands.length) {
      setResults([]);
      return;
    }

    const q = debouncedQuery.toLowerCase();
    const filtered = demands.filter(d => {
      return (
        d.demandId.toLowerCase().includes(q) ||
        d.operation.toLowerCase().includes(q) ||
        d.task.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q) ||
        d.history.toLowerCase().includes(q)
      );
    });

    setResults(filtered.slice(0, 5));
  }, [debouncedQuery, demands]);

  const handleSelect = (demandId: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/demands?open=${demandId}`);
  };

  return (
    <div className="relative w-full max-w-[280px] sm:max-w-[320px]" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Pesquisar ID, Operação, Tarefa..."
          className="w-full bg-muted/60 hover:bg-muted focus:bg-background border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && (query.trim() !== '') && (
        <div className="absolute right-0 top-full mt-1.5 w-full min-w-[280px] sm:min-w-[360px] bg-popover border border-border rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border">
            Resultados da busca ({results.length})
          </div>
          {results.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto divide-y divide-border/60">
              {results.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleSelect(d.id)}
                  className="w-full text-left px-3 py-2.5 hover:bg-accent flex items-start justify-between gap-3 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-violet-500">{d.demandId || '#----'}</span>
                      <OperationBadge operation={d.operation} className="px-1.5 py-0 text-[10px]" />
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{d.task || 'Sem título'}</p>
                    {d.notes && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{d.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={d.status} className="px-1.5 py-0 text-[10px]" />
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
