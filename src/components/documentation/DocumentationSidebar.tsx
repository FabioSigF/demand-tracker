'use client';
import { useOperations } from '@/hooks/useOperations';
import { getOperationColor } from '@/lib/constants';
import { DocumentationPage } from '@/types/index';
import { cn } from '@/lib/utils';
import {
  Folder,
  FolderOpen,
  Plus,
  Layers,
  Share2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { useState } from 'react';
import { DocumentationFilters } from './DocumentationFilters';
import { DocumentationItem } from './DocumentationItem';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export interface FilterType {
  type: 'all' | 'shared' | 'operation';
  value?: string; // operationId
}

interface DocumentationSidebarProps {
  pages: DocumentationPage[];
  loading: boolean;
  selectedPageId: string | null;
  onSelectPage: (id: string) => void;
  activeFilter: FilterType;
  onChangeFilter: (filter: FilterType) => void;
  onDeletePage: (id: string) => Promise<void>;
  onCreatePageClick: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (c: string) => void;
  isDragEnabled: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DocumentationSidebar({
  pages,
  loading,
  selectedPageId,
  onSelectPage,
  activeFilter,
  onChangeFilter,
  onDeletePage,
  onCreatePageClick,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  isDragEnabled,
  mobileOpen,
  onMobileClose,
}: DocumentationSidebarProps) {
  const { operations, loading: loadingOps } = useOperations();
  const [opsExpanded, setOpsExpanded] = useState(true);

  // Calculate counts for filters
  const totalCount = pages.length;
  const sharedCount = pages.filter(p => !p.operationIds || p.operationIds.length === 0).length;

  const getOperationCount = (opId: string) => {
    return pages.filter(p => p.operationIds && p.operationIds.includes(opId)).length;
  };

  // Filter logic for matching pages to show in the list
  const getFilteredPages = () => {
    let list = [...pages];

    // Filter by Scope/Sidebar filter first
    if (activeFilter.type === 'shared') {
      list = list.filter(p => !p.operationIds || p.operationIds.length === 0);
    } else if (activeFilter.type === 'operation' && activeFilter.value) {
      const opId = activeFilter.value;
      list = list.filter(p => p.operationIds && p.operationIds.includes(opId));
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.content && p.content.toLowerCase().includes(q))
      );
    }

    // Filter by Category
    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory);
    }

    return list;
  };

  const filteredPages = getFilteredPages();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card">
      {/* Search and Action Header */}
      <div className="p-4 border-b border-border/60 space-y-3 shrink-0">
        <button
          onClick={onCreatePageClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/10 transition-all duration-200 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Documentação</span>
        </button>

        <DocumentationFilters
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
        />
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {/* Main Filters */}
        <div className="space-y-1">
          <button
            onClick={() => {
              onChangeFilter({ type: 'all' });
              onMobileClose?.();
            }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
              activeFilter.type === 'all'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4" />
              <span>Todos os Documentos</span>
            </div>
            <span className="text-[10px] font-bold bg-muted/65 dark:bg-muted/30 px-2 py-0.5 rounded-full text-muted-foreground">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => {
              onChangeFilter({ type: 'shared' });
              onMobileClose?.();
            }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
              activeFilter.type === 'shared'
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Share2 className="w-4 h-4" />
              <span>Compartilhados</span>
            </div>
            <span className="text-[10px] font-bold bg-muted/65 dark:bg-muted/30 px-2 py-0.5 rounded-full text-muted-foreground">
              {sharedCount}
            </span>
          </button>
        </div>

        {/* Operations Section */}
        <div className="space-y-1">
          <button
            onClick={() => setOpsExpanded(!opsExpanded)}
            className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold text-muted-foreground/80 hover:text-foreground uppercase tracking-wider transition-colors"
          >
            <span>Operações</span>
            {opsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {opsExpanded && (
            <div className="space-y-0.5 pl-1.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {loadingOps ? (
                <div className="px-3 py-1.5 text-xs text-muted-foreground animate-pulse">
                  Carregando operações...
                </div>
              ) : (
                operations.map(op => {
                  const isActive = activeFilter.type === 'operation' && activeFilter.value === op.id;
                  const count = getOperationCount(op.id);
                  const colors = getOperationColor(op.name, op.color);

                  return (
                    <button
                      key={op.id}
                      onClick={() => {
                        onChangeFilter({ type: 'operation', value: op.id });
                        onMobileClose?.();
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                        isActive
                          ? cn(colors.bg, colors.text, "font-semibold")
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/35"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Folder className={cn("w-3.5 h-3.5 shrink-0", isActive ? colors.text : "text-muted-foreground/75")} />
                        <span className="truncate">{op.name}</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-muted/50 dark:bg-muted/20 rounded-md">
                        {count}
                      </span>
                    </button>
                  );
                })
              )}
              {!loadingOps && operations.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground italic">
                  Nenhuma cadastrada
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 my-2" />

        {/* Document List */}
        <div className="space-y-2">
          <h3 className="px-3 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
            {activeFilter.type === 'all' && 'Todos os Documentos'}
            {activeFilter.type === 'shared' && 'Documentos Compartilhados'}
            {activeFilter.type === 'operation' && `Filtro: ${operations.find(o => o.id === activeFilter.value)?.name ?? ''}`}
          </h3>

          <div className="space-y-1.5 pt-1">
            {loading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-14 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <SortableContext
                items={filteredPages.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredPages.map((page) => (
                  <DocumentationItem
                    key={page.id}
                    page={page}
                    isActive={selectedPageId === page.id}
                    onClick={() => {
                      onSelectPage(page.id);
                      onMobileClose?.();
                    }}
                    onDelete={onDeletePage}
                    isDragEnabled={isDragEnabled}
                  />
                ))}
              </SortableContext>
            )}

            {!loading && filteredPages.length === 0 && (
              <div className="px-4 py-8 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground font-semibold">
                  Nenhum documento encontrado
                </p>
                <p className="text-[10px] text-muted-foreground/60 max-w-[150px] mt-0.5">
                  Crie um novo documento para começar a documentar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer (Overlay and Panel) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            onClick={onMobileClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ease-out"
          />
          {/* Drawer container */}
          <aside className="relative flex flex-col w-72 max-w-[80vw] h-full bg-card border-r border-border animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop aside sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r border-border h-full shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
