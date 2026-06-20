'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNotepad } from '@/hooks/useNotepad';
import { NotePage } from '@/types/index';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { useConfirm } from '@/contexts/ConfirmModalContext';
import {
  NotebookPen, X, Plus, ChevronLeft, ChevronRight,
  Minus, Maximize2, Minimize2,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Constantes ────────────────────────────────────────────────────────────────
const MARGIN          = 24;
const WIDGET_W_NORMAL   = 480;
const WIDGET_W_EXPANDED = 780;
const WIDGET_H_NORMAL   = 460;
const WIDGET_H_EXPANDED = 600;
const TITLEBAR_H        = 37; // altura da barra quando minimizado

// ── Utilitários ───────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Garante que o widget (com dimensões w×h) fique inteiramente dentro
 * da viewport, respeitando a margem configurada.
 */
function clampPos(
  pos: { x: number; y: number },
  w: number,
  h: number
): { x: number; y: number } {
  if (typeof window === 'undefined') return pos;
  return {
    x: clamp(pos.x, MARGIN, window.innerWidth  - w - MARGIN),
    y: clamp(pos.y, MARGIN, window.innerHeight - h - MARGIN),
  };
}

function defaultPos(w: number, h: number): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  return {
    x: window.innerWidth  - w - MARGIN,
    y: window.innerHeight - h - MARGIN,
  };
}

// ── Hook: drag com clamping contínuo ─────────────────────────────────────────
/**
 * Clamping aplicado em CADA evento mousemove — o widget nunca ultrapassa
 * os limites da viewport, nem durante o arrasto.
 * getSize() é chamado a cada movimento para usar as dimensões atuais.
 */
function useDraggable(
  initialPos: { x: number; y: number },
  getSize: () => { w: number; h: number }
) {
  const [pos, setPos] = useState(initialPos);
  const dragging    = useRef(false);
  const startMouse  = useRef({ x: 0, y: 0 });
  const startPos    = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragging.current   = true;
    startMouse.current = { x: e.clientX, y: e.clientY };
    startPos.current   = pos;
  }, [pos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const raw = {
        x: startPos.current.x + (e.clientX - startMouse.current.x),
        y: startPos.current.y + (e.clientY - startMouse.current.y),
      };
      const { w, h } = getSize();
      setPos(clampPos(raw, w, h));
    };

    const onUp = () => { dragging.current = false; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, [getSize]);

  return { pos, setPos, onMouseDown };
}

// ── PageEditor ────────────────────────────────────────────────────────────────
interface PageEditorProps {
  page: NotePage;
  onSave: (id: string, data: Partial<Pick<NotePage, 'title' | 'content'>>) => Promise<void>;
}

function PageEditor({ page, onSave }: PageEditorProps) {
  const [title,   setTitle]   = useState(page.title);
  const [content, setContent] = useState(page.content);

  const pageIdRef   = useRef(page.id);
  const onSaveRef   = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; });

  const pendingRef  = useRef({ title: page.title, content: page.content });
  const savedRef    = useRef({ title: page.title, content: page.content });
  const timerRef    = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    pageIdRef.current  = page.id;
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
    const p = pendingRef.current; const s = savedRef.current;
    return p.title !== s.title || p.content !== s.content;
  };

  const saveNow = useCallback(async () => {
    if (!hasPending() || isSavingRef.current) return;
    isSavingRef.current = true;
    const snapshot = { ...pendingRef.current };
    try {
      await onSaveRef.current(pageIdRef.current, snapshot);
      savedRef.current = snapshot;
    } catch { /* silencioso */ } finally {
      isSavingRef.current = false;
    }
  }, []);

  const schedule = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(saveNow, 1500);
  }, [saveNow]);

  useEffect(() => () => { clearTimer(); saveNow(); }, [saveNow]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 pt-3 pb-2 shrink-0">
        <input
          type="text"
          value={title}
          maxLength={60}
          onChange={(e) => {
            const v = e.target.value;
            setTitle(v);
            pendingRef.current.title = v;
            schedule();
          }}
          placeholder="Título da página..."
          className="w-full bg-transparent text-sm font-semibold text-foreground border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none transition pb-0.5 placeholder:text-muted-foreground/50"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
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
  const [tabOffset,   setTabOffset]   = useState(0);
  const [isMobile,    setIsMobile]    = useState(false);

  // Monitor screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Dimensões atuais
  const widgetW = isExpanded ? WIDGET_W_EXPANDED : WIDGET_W_NORMAL;
  const widgetH = isExpanded ? WIDGET_H_EXPANDED : WIDGET_H_NORMAL;

  // getSize estável via ref — não recria o listener de mousemove quando muda
  const sizeRef = useRef({ w: widgetW, h: widgetH });
  useEffect(() => { sizeRef.current = { w: widgetW, h: widgetH }; }, [widgetW, widgetH]);
  const getSize = useCallback(() => sizeRef.current, []);

  // ── Posição aberta (arrastável) ───────────────────────────────────────────
  const [openPos, setOpenPos] = useState(() =>
    defaultPos(WIDGET_W_NORMAL, WIDGET_H_NORMAL)
  );

  const { pos: dragPos, setPos: setDragPos, onMouseDown } = useDraggable(openPos, getSize);

  // Ao mudar de tamanho (expandir/recolher), garante que não saia da tela
  useEffect(() => {
    if (!isOpen || isMinimized || isMobile) return;
    setDragPos(prev => clampPos(prev, widgetW, widgetH));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetW, widgetH, isMobile]);

  // Posição minimizada: sempre canto inferior direito (não arrastável)
  const miniPos = typeof window !== 'undefined'
    ? { x: window.innerWidth - WIDGET_W_NORMAL - MARGIN, y: window.innerHeight - TITLEBAR_H - MARGIN }
    : { x: 0, y: 0 };

  // Quando restaura, retoma a posição de quando estava aberto
  const handleMinimize = () => {
    if (isMobile) return;
    if (isMinimized) {
      setIsMinimized(false);
      setDragPos(openPos);
    } else {
      setOpenPos(dragPos); // salva posição atual
      setIsMinimized(true);
    }
  };

  // Ao fechar: reseta para posição padrão
  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    const def = defaultPos(WIDGET_W_NORMAL, WIDGET_H_NORMAL);
    setOpenPos(def);
    setDragPos(def);
  };

  // Posição efetiva
  const effectivePos = isMinimized ? miniPos : dragPos;

  // Redimensionamento de janela: reclampeia posição atual
  useEffect(() => {
    const onResize = () => {
      if (!isOpen || isMinimized || isMobile) return;
      setDragPos(prev => clampPos(prev, widgetW, widgetH));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isOpen, isMinimized, widgetW, widgetH, setDragPos, isMobile]);

  // ── Páginas ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pages.length > 0 && !activeId) setActiveId(pages[0].id);
    if (activeId && !pages.find(p => p.id === activeId)) setActiveId(pages[0]?.id ?? null);
  }, [pages, activeId]);

  const activePage = pages.find(p => p.id === activeId) ?? null;

  const handleAddPage = async () => {
    try { const id = await addPage(); if (id) setActiveId(id); }
    catch { toast.error('Erro ao criar página'); }
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
    try { await removePage(page.id); toast.success('Página excluída'); }
    catch { toast.error('Erro ao excluir página'); }
  };

  const TAB_SCROLL = 120;

  // ── JSX ───────────────────────────────────────────────────────────────────
  const widget = (
    <>
      {/* FAB */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            const def = defaultPos(WIDGET_W_NORMAL, WIDGET_H_NORMAL);
            setOpenPos(def);
            setDragPos(def);
          }}
          title="Bloco de notas"
          className="fixed bottom-6 right-6 z-[70] w-12 h-12 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white shadow-xl shadow-violet-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <NotebookPen className="w-5 h-5" />
        </button>
      )}

      {/* Widget */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            left:   isMobile ? 0 : effectivePos.x,
            top:    isMobile ? 0 : effectivePos.y,
            width:  isMobile ? '100vw' : (isMinimized ? WIDGET_W_NORMAL : widgetW),
            height: isMobile ? '100dvh' : (isMinimized ? 'auto' : widgetH),
            zIndex: 70,
            borderRadius: isMobile ? '0px' : '1rem',
          }}
          className="bg-popover border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Titlebar — arrastável apenas no desktop */}
          <div
            onMouseDown={(!isMinimized && !isMobile) ? onMouseDown : undefined}
            className={[
              'flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30 shrink-0',
              (!isMinimized && !isMobile) ? 'cursor-grab active:cursor-grabbing select-none' : 'cursor-default select-none',
            ].join(' ')}
          >
            <NotebookPen className="w-3.5 h-3.5 text-violet-500 shrink-0 pointer-events-none" />
            <span
              className="text-xs font-semibold text-foreground flex-1 pointer-events-none"
              onDoubleClick={!isMobile ? handleMinimize : undefined}
              title={!isMobile ? "Duplo clique para minimizar/restaurar" : undefined}
            >
              Bloco de Notas
            </span>

            <div className="flex items-center gap-1">
              {!isMobile && (
                <>
                  <button onClick={handleMinimize} title={isMinimized ? 'Restaurar' : 'Minimizar'}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition">
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  {!isMinimized && (
                    <button onClick={() => setIsExpanded(v => !v)} title={isExpanded ? 'Reduzir' : 'Expandir'}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition">
                      {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </>
              )}

              <button onClick={handleClose} title="Fechar"
                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Abas */}
          {!isMinimized && (
            <div className="flex items-center border-b border-border bg-muted/20 shrink-0 min-h-0">
              {tabOffset > 0 && (
                <button onClick={() => setTabOffset(v => Math.max(0, v - TAB_SCROLL))}
                  className="p-1 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="flex-1 overflow-hidden">
                <div className="flex transition-transform duration-200"
                  style={{ transform: `translateX(-${tabOffset}px)` }}>
                  {pages.map(page => (
                    <button key={page.id} onClick={() => setActiveId(page.id)}
                      className={[
                        'group flex items-center gap-1.5 px-3 py-2 text-xs font-medium',
                        'shrink-0 max-w-[140px] border-r border-border/50 transition-colors',
                        page.id === activeId
                          ? 'bg-popover text-foreground border-b-2 border-b-violet-500 -mb-px'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                      ].join(' ')}
                    >
                      <span className="truncate flex-1 text-left">{page.title || 'Sem título'}</span>
                      <span
                        onClick={(e) => handleDeletePage(page, e)}
                        className="shrink-0 p-0.5 rounded hover:bg-destructive/15 hover:text-destructive text-muted-foreground/0 group-hover:text-muted-foreground transition-all cursor-pointer"
                        role="button" title="Excluir página"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setTabOffset(v => v + TAB_SCROLL)}
                className="p-1 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button onClick={handleAddPage} title="Nova página"
                className="p-1.5 shrink-0 text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition border-l border-border/50">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Conteúdo */}
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
                  <button onClick={handleAddPage}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition">
                    <Plus className="w-3.5 h-3.5" />
                    Criar primeira página
                  </button>
                </div>
              ) : activePage ? (
                <PageEditor key={activePage.id} page={activePage} onSave={editPage} />
              ) : null}
            </div>
          )}

          {/* Rodapé */}
          {!isMinimized && pages.length > 0 && (
            <div className="px-4 py-1.5 border-t border-border/50 bg-muted/10 shrink-0 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {pages.length} página{pages.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {activePage
                  ? `Editado ${activePage.updatedAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
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