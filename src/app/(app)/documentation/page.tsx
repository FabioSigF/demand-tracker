'use client';
import { useState, useMemo, useEffect } from 'react';
import { useDocumentation } from '@/hooks/useDocumentation';
import { DocumentationSidebar, FilterType } from '@/components/documentation/DocumentationSidebar';
import { DocumentationEditor } from '@/components/documentation/DocumentationEditor';
import { DocumentationCreateModal } from '@/components/documentation/DocumentationCreateModal';
import { DocumentationPage, DocumentationCategory } from '@/types/index';
import { BookOpen, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

export default function DocumentationViewPage() {
  const { pages, loading, addPage, editPage, removePage, reorder } = useDocumentation();

  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Check for deep links (e.g. from DemandDrawer)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const openParam = params.get('open');
    if (openParam && pages.length) {
      const match = pages.find(p => p.id === openParam);
      if (match) {
        setActivePageId(match.id);
        const url = new URL(window.location.href);
        url.searchParams.delete('open');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    }
  }, [pages]);

  // Derive the active page object
  const activePage = useMemo(() => {
    return pages.find(p => p.id === activePageId) ?? null;
  }, [pages, activePageId]);

  // Check if drag reordering should be enabled
  const isDragEnabled = !searchQuery.trim() && selectedCategory === 'all';

  // Get filtered pages helper for drag-and-drop array moves
  const getFilteredPages = () => {
    let list = [...pages];

    if (activeFilter.type === 'shared') {
      list = list.filter(p => !p.operationIds || p.operationIds.length === 0);
    } else if (activeFilter.type === 'operation' && activeFilter.value) {
      const opId = activeFilter.value;
      list = list.filter(p => p.operationIds && p.operationIds.includes(opId));
    }

    return list;
  };

  // DnD sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const visibleList = getFilteredPages();
    const oldIndex = visibleList.findIndex((item) => item.id === active.id);
    const newIndex = visibleList.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedList = arrayMove(visibleList, oldIndex, newIndex);

    const updates = reorderedList.map((item, index) => ({
      id: item.id,
      order: (index + 1) * 1000,
    }));

    try {
      await reorder(updates);
    } catch (err) {
      toast.error('Erro ao salvar nova ordem');
    }
  };

  const handleCreatePage = async (data: {
    title: string;
    category: DocumentationCategory;
    operationIds: string[];
  }) => {
    try {
      const newId = await addPage(data);
      if (newId) {
        setActivePageId(newId);
        toast.success('Documento criado');
      }
    } catch (err) {
      toast.error('Erro ao criar documento');
    }
  };

  const handleSavePage = async (
    id: string,
    data: Partial<Omit<DocumentationPage, 'id' | 'userId' | 'createdAt'>>
  ) => {
    console.log("[handleSavePage] id:", id, "data:", data);
    try {
      await editPage(id, data);
      console.log("[handleSavePage] editPage resolved successfully");
    } catch (err) {
      console.error("[handleSavePage] editPage rejected with error:", err);
      throw err;
    }
  };

  const handleDeletePage = async (id: string) => {
    try {
      await removePage(id);
      if (activePageId === id) {
        setActivePageId(null);
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
        {/* Sidebar Panel - Full width on mobile when no page is selected */}
        <div className={cn(
          "w-full md:w-72 shrink-0 h-full border-r border-border/60 bg-card",
          activePageId !== null && "hidden md:block"
        )}>
          <DocumentationSidebar
            pages={pages}
            loading={loading}
            selectedPageId={activePageId}
            onSelectPage={setActivePageId}
            activeFilter={activeFilter}
            onChangeFilter={setActiveFilter}
            onDeletePage={handleDeletePage}
            onCreatePageClick={() => setIsCreateModalOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            isDragEnabled={isDragEnabled}
          />
        </div>

        {/* Editor Panel - Full width on mobile when page is selected */}
        <div className={cn(
          "flex-1 h-full min-w-0 bg-background",
          activePageId === null && "hidden md:block"
        )}>
          {activePage ? (
            <DocumentationEditor
              key={activePage.id}
              page={activePage}
              onSave={handleSavePage}
              onDelete={handleDeletePage}
              onCloseMobile={() => setActivePageId(null)}
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-6 bg-muted/5">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Nenhum documento selecionado</h2>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Selecione um documento na barra lateral ou crie um novo para iniciar a escrita de suas especificações.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl transition duration-200"
              >
                Criar Nova Documentação
              </button>
            </div>
          )}
        </div>

        {/* Create Document Modal */}
        <DocumentationCreateModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreatePage}
        />
      </div>
    </DndContext>
  );
}
