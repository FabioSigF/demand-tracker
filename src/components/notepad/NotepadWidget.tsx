'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNotepad } from '@/hooks/useNotepad';
import { NotePage } from '@/types/index';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { useConfirm } from '@/contexts/ConfirmModalContext';
import {
  NotebookPen, X, Plus, Trash2, ChevronLeft, ChevronRight,
  Minus, Maximize2, Minimize2,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Autosave por página ───────────────────────────────────────────────────────

interface PageEditorProps {
  page: NotePage;
  onSave: (id: string, data: Partial<Pick<NotePage, 'title' | 'content'>>) => Promise<void>;
}

function PageEditor({ page, onSave }: PageEditorProps) {
  const [title,   setTitle]   = useState(page.title);
  const [content, setContent] = useState(page.content);

  // Refs para autosave estável (mesmo padrão do DemandDrawer)
  const pageIdRef    = useRef(page.id);
  const onSaveRef    = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; });

  const pendingRef = useRef({ title: page.title, content: page.content });
  const savedRef   = useRef({ title: page.title, content: page.content });
  const timerRef   = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Re-inicializa quando a página muda
  useEffect(() => {
    pageIdRef.current = page.id;
    setTitle(page.title);
    setContent(page.content);
    pendingRef.current = { title: page.title, content: page.content };
    savedRef.current   = { title: page.title, content: page.content };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id]);

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const hasPending = () => {
    const p = pendingRef.current;
    const s = savedRef.current;
    return p.title !== s.title || p.content !== s.content;
  };

  const saveNow = useCallback(async () => {
    if (!hasPending() || isSavingRef.current) return;
    isSavingRef.current = true;
    const snapshot = { ...pendingRef.current };
    try {
      await onSaveRef.current(pageIdRef.current, snapshot);
      savedRef.current = snapshot;
    } catch {
      // silencioso — não interrompe o usuário
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  const schedule = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(saveNow, 1500);
  }, [saveNow]);

  // Salva ao desmontar (trocar de aba ou fechar)
  useEffect(() => () => { clearTimer(); saveNow(); }, [saveNow]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Título da página */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <input
          type="text"
          value={title}
          maxLength={60}
          onChange={(e) => {
            const val = e.target.value;
            setTitle(val);
            pendingRef.current.title = val;
            schedule();
          }}
          placeholder="Título da página..."
          className="w-full bg-transparent text-sm font-semibold text-foreground border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none transition pb-0.5 placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0 tiptap-notepad">
        <TiptapEditor
          value={content}
          onChange={(val) => {
            setContent(val);
            pendingRef.current.content = val;
            schedule();
          }}
        />
      </div>
    </div>
  );
}

// ── Widget principal ──────────────────────────────────────────────────────────

export function NotepadWidget() {
  const { pages, loading, addPage, editPage, removePage } = useNotepad();
  const { confirm } = useConfirm();

  const [isOpen,      setIsOpen]      = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded,  setIsExpanded]  = useState(false);
  const [activeId,    setActiveId]    = useState<string | null>(null);
  const [tabOffset,   setTabOffset]   = useState(0); // scroll horizontal de abas

  // Seleciona a primeira página ao abrir ou ao carregar
  useEffect(() => {
    if (pages.length > 0 && !activeId) {
      setActiveId(pages[0].id);
    }
    // Se a página ativa foi deletada, vai para a primeira
    if (activeId && !pages.find(p => p.id === activeId)) {
      setActiveId(pages[0]?.id ?? null);
    }
  }, [pages, activeId]);

  const activePage = pages.find(p => p.id === activeId) ?? null;

  const handleAddPage = async () => {
    try {
      const id = await addPage();
      if (id) setActiveId(id);
    } catch {
      toast.error('Erro ao criar página');
    }
  };

  const handleDeletePage = async (page: NotePage, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Excluir página',
      description: `"${page.title}" será excluída permanentemente.`,
      confirmText: 'Excluir',
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await removePage(page.id);
      toast.success('Página excluída');
    } catch {
      toast.error('Erro ao excluir página');
    }
  };

  const TAB_SCROLL = 120;

  // Dimensões do widget
  const widgetW = isExpanded ? 'w-[780px]' : 'w-[480px]';
  const widgetH = isExpanded ? 'h-[600px]' : 'h-[460px]';

  const widget = (
    <>
      {/* FAB — botão flutuante */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          title="Bloco de notas"
          className="fixed bottom-6 right-6 z-[70] w-12 h-12 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white shadow-xl shadow-violet-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <NotebookPen className="w-5 h-5" />
        </button>
      )}

      {/* Widget */}
      {isOpen && (
        <div
          className={`
            fixed bottom-6 right-6 z-[70]
            ${widgetW}
            ${isMinimized ? 'h-auto' : widgetH}
            bg-popover border border-border rounded-2xl shadow-2xl
            flex flex-col overflow-hidden
            animate-in fade-in zoom-in-95 duration-200
            transition-all
          `}
        >
          {/* ── Titlebar ── */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30 shrink-0">
            <NotebookPen className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <span className="text-xs font-semibold text-foreground flex-1 select-none">
              Bloco de Notas
            </span>

            <div className="flex items-center gap-1">
              {/* Minimizar */}
              <button
                onClick={() => setIsMinimized(v => !v)}
                title={isMinimized ? 'Restaurar' : 'Minimizar'}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* Expandir / contrair */}
              {!isMinimized && (
                <button
                  onClick={() => setIsExpanded(v => !v)}
                  title={isExpanded ? 'Reduzir' : 'Expandir'}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  {isExpanded
                    ? <Minimize2 className="w-3.5 h-3.5" />
                    : <Maximize2 className="w-3.5 h-3.5" />
                  }
                </button>
              )}

              {/* Fechar */}
              <button
                onClick={() => setIsOpen(false)}
                title="Fechar"
                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Abas estilo Windows Notepad ── */}
          {!isMinimized && (
            <div className="flex items-center border-b border-border bg-muted/20 shrink-0 min-h-0">
              {/* Scroll esquerda */}
              {tabOffset > 0 && (
                <button
                  onClick={() => setTabOffset(v => Math.max(0, v - TAB_SCROLL))}
                  className="p-1 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Lista de abas com overflow hidden */}
              <div className="flex-1 overflow-hidden">
                <div
                  className="flex transition-transform duration-200"
                  style={{ transform: `translateX(-${tabOffset}px)` }}
                >
                  {pages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => setActiveId(page.id)}
                      className={`
                        group flex items-center gap-1.5 px-3 py-2 text-xs font-medium
                        shrink-0 max-w-[140px] border-r border-border/50
                        transition-colors
                        ${page.id === activeId
                          ? 'bg-popover text-foreground border-b-2 border-b-violet-500 -mb-px'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }
                      `}
                    >
                      <span className="truncate flex-1 text-left">
                        {page.title || 'Sem título'}
                      </span>
                      <span
                        onClick={(e) => handleDeletePage(page, e)}
                        className="shrink-0 p-0.5 rounded hover:bg-destructive/15 hover:text-destructive text-muted-foreground/0 group-hover:text-muted-foreground transition-all cursor-pointer"
                        role="button"
                        title="Excluir página"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scroll direita */}
              <button
                onClick={() => setTabOffset(v => v + TAB_SCROLL)}
                className="p-1 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Nova página */}
              <button
                onClick={handleAddPage}
                title="Nova página"
                className="p-1.5 shrink-0 text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition border-l border-border/50"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Conteúdo ── */}
          {!isMinimized && (
            <div className="flex-1 min-h-0 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  Carregando...
                </div>
              ) : pages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                  <NotebookPen className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nenhuma página ainda.</p>
                  <button
                    onClick={handleAddPage}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Criar primeira página
                  </button>
                </div>
              ) : activePage ? (
                /* Key garante re-montagem ao trocar de aba — reinicia o estado do editor */
                <PageEditor
                  key={activePage.id}
                  page={activePage}
                  onSave={editPage}
                />
              ) : null}
            </div>
          )}

          {/* ── Rodapé de status ── */}
          {!isMinimized && pages.length > 0 && (
            <div className="px-4 py-1.5 border-t border-border/50 bg-muted/10 shrink-0 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {pages.length} página{pages.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {activePage
                  ? `Editado ${new Date(activePage.updatedAt.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(widget, document.body)
    : null;
}