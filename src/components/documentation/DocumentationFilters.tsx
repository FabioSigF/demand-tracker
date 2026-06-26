'use client';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { DocumentationCategory } from '@/types/index';
import { DOCUMENTATION_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface DocumentationFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string; // 'all' or DocumentationCategory
  onCategoryChange: (category: string) => void;
  className?: string;
}

export function DocumentationFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  className,
}: DocumentationFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all';

  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange('all');
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75" />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-muted/30 border border-border rounded-lg placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:bg-muted"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "p-1.5 rounded-lg border text-muted-foreground hover:bg-muted transition-colors active:scale-95 flex items-center justify-center",
            showFilters || hasActiveFilters
              ? "border-primary/50 text-primary bg-primary/5"
              : "border-border/80"
          )}
          title="Filtros avançados"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {showFilters && (
        <div className="p-3 bg-muted/10 border border-border/80 rounded-xl space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Filtros</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[10px] font-medium text-primary hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground">Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-muted/40 border border-border rounded-md focus:outline-none focus:border-primary transition"
            >
              <option value="all">Todas as categorias</option>
              {DOCUMENTATION_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
