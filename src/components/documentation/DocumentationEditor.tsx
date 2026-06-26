'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { DocumentationPage, DocumentationCategory, Demand } from '@/types/index';
import { TiptapEditor } from '@/components/editor/TiptapEditor';
import { DOCUMENTATION_CATEGORIES, getOperationColor } from '@/lib/constants';
import { DocumentationOperationSelector } from './DocumentationOperationSelector';
import { useDemands } from '@/hooks/useDemands';
import { useOperations } from '@/hooks/useOperations';
import { useConfirm } from '@/contexts/ConfirmModalContext';
import { 
  Calendar, 
  Trash2, 
  ArrowLeft, 
  CloudCheck, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Link as LinkIcon, 
  X,
  Plus
} from 'lucide-react';
import { cn, formatDateFull } from '@/lib/utils';
import { toast } from 'sonner';

interface DocumentationEditorProps {
  page: DocumentationPage;
  onSave: (id: string, data: Partial<Omit<DocumentationPage, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCloseMobile?: () => void;
}

export function DocumentationEditor({
  page,
  onSave,
  onDelete,
  onCloseMobile,
}: DocumentationEditorProps) {
  const { confirm } = useConfirm();
  const { demands, loading: loadingDemands } = useDemands();
  const { operations } = useOperations();

  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [category, setCategory] = useState(page.category);
  const [operationIds, setOperationIds] = useState(page.operationIds || []);
  const [relatedDemandIds, setRelatedDemandIds] = useState(page.relatedDemandIds || []);

  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [metadataOpen, setMetadataOpen] = useState(true);
  const [demandSearch, setDemandSearch] = useState('');
  const [showDemandDropdown, setShowDemandDropdown] = useState(false);

  const pageIdRef = useRef(page.id);
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; });

  const pendingRef = useRef({
    title: page.title,
    content: page.content,
    category: page.category,
    operationIds: page.operationIds || [],
    relatedDemandIds: page.relatedDemandIds || [],
  });

  const savedRef = useRef({
    title: page.title,
    content: page.content,
    category: page.category,
    operationIds: page.operationIds || [],
    relatedDemandIds: page.relatedDemandIds || [],
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Sync internal states when page changes
  useEffect(() => {
    pageIdRef.current = page.id;
    setTitle(page.title);
    setContent(page.content);
    setCategory(page.category);
    setOperationIds(page.operationIds || []);
    setRelatedDemandIds(page.relatedDemandIds || []);

    pendingRef.current = {
      title: page.title,
      content: page.content,
      category: page.category,
      operationIds: [...(page.operationIds || [])],
      relatedDemandIds: [...(page.relatedDemandIds || [])],
    };
    savedRef.current = {
      title: page.title,
      content: page.content,
      category: page.category,
      operationIds: [...(page.operationIds || [])],
      relatedDemandIds: [...(page.relatedDemandIds || [])],
    };
    setSavingStatus('idle');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const hasPending = () => {
    const p = pendingRef.current;
    const s = savedRef.current;
    return (
      p.title !== s.title ||
      p.content !== s.content ||
      p.category !== s.category ||
      JSON.stringify(p.operationIds) !== JSON.stringify(s.operationIds) ||
      JSON.stringify(p.relatedDemandIds) !== JSON.stringify(s.relatedDemandIds)
    );
  };

  const saveNow = useCallback(async () => {
    console.log("[saveNow] triggered. hasPending:", hasPending(), "isSavingRef.current:", isSavingRef.current);
    if (!hasPending() || isSavingRef.current) return;
    isSavingRef.current = true;
    setSavingStatus('saving');
    const snapshot = { ...pendingRef.current };
    console.log("[saveNow] calling onSave with pageId:", pageIdRef.current, "snapshot:", snapshot);
    try {
      await onSaveRef.current(pageIdRef.current, snapshot);
      console.log("[saveNow] onSave resolved successfully");
      savedRef.current = snapshot;
      setSavingStatus('saved');
    } catch (err) {
      console.error("[saveNow] onSave rejected with error:", err);
      toast.error('Erro ao salvar alterações');
      setSavingStatus('idle');
    } finally {
      isSavingRef.current = false;
      console.log("[saveNow] isSavingRef.current set to false");
    }
  }, []);

  const schedule = useCallback(() => {
    console.log("[schedule] called");
    clearTimer();
    setSavingStatus('saving');
    timerRef.current = setTimeout(saveNow, 2000);
  }, [saveNow]);

  // Save on unmount
  useEffect(() => {
    return () => {
      console.log("[unmount] cleaning up timer and calling saveNow");
      clearTimer();
      saveNow();
    };
  }, [saveNow]);

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Excluir documento',
      description: `Esta ação excluirá permanentemente o documento "${title}". Deseja continuar?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (confirmed) {
      try {
        await onDelete(page.id);
        toast.success('Documento excluído');
      } catch (err) {
        toast.error('Erro ao excluir documento');
      }
    }
  };

  // Filter demands for combobox selection
  const unlinkedDemands = demands.filter(d => 
    !relatedDemandIds.includes(d.id) &&
    (d.demandId.toLowerCase().includes(demandSearch.toLowerCase()) || 
     d.task.toLowerCase().includes(demandSearch.toLowerCase()))
  );

  const handleLinkDemand = (demandId: string) => {
    const updated = [...relatedDemandIds, demandId];
    setRelatedDemandIds(updated);
    pendingRef.current.relatedDemandIds = updated;
    setDemandSearch('');
    setShowDemandDropdown(false);
    schedule();
  };

  const handleUnlinkDemand = (demandId: string) => {
    const updated = relatedDemandIds.filter(id => id !== demandId);
    setRelatedDemandIds(updated);
    pendingRef.current.relatedDemandIds = updated;
    schedule();
  };

  return (
    <div className="flex flex-col h-full bg-background min-w-0">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2">
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          
          {/* Saving Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {savingStatus === 'saving' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Salvando...</span>
              </>
            )}
            {savingStatus === 'saved' && (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Salvo</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleDelete}
          className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          title="Excluir documento"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => {
            const v = e.target.value;
            setTitle(v);
            pendingRef.current.title = v;
            schedule();
          }}
          placeholder="Título da documentação..."
          className="w-full bg-transparent text-xl md:text-2xl font-bold text-foreground focus:outline-none placeholder:text-muted-foreground/40 leading-snug"
        />

        {/* Metadata Accordion Panel */}
        <div className="border border-border/80 rounded-2xl overflow-hidden bg-card/50">
          <button
            onClick={() => setMetadataOpen(!metadataOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-colors"
          >
            <span className="flex items-center gap-1.5">Metadados & Vínculos</span>
            {metadataOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {metadataOpen && (
            <div className="p-4 space-y-4 border-t border-border/60 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left col: Category & Dates */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Categoria (BABOK / Sistema)</label>
                    <select
                      value={category}
                      onChange={(e) => {
                        const v = e.target.value as DocumentationCategory;
                        setCategory(v);
                        pendingRef.current.category = v;
                        schedule();
                      }}
                      className="w-full px-3 py-1.5 bg-muted/40 border border-border rounded-lg focus:outline-none focus:border-primary transition"
                    >
                      {DOCUMENTATION_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 text-[10px] text-muted-foreground/80 mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Criado em: {formatDateFull(page.createdAt)}</span>
                    </div>
                    {page.updatedAt && (
                      <div className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        <span>Atualizado em: {formatDateFull(page.updatedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right col: Associated Operations */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground block">Operações Relacionadas</label>
                  <DocumentationOperationSelector
                    selectedIds={operationIds}
                    onChange={(ids) => {
                      setOperationIds(ids);
                      pendingRef.current.operationIds = ids;
                      schedule();
                    }}
                    className="p-1"
                  />
                </div>
              </div>

              {/* Linked Demands Section */}
              <div className="space-y-2 border-t border-border/40 pt-3">
                <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Demandas Vinculadas</span>
                </label>

                {/* Combobox Search */}
                <div className="relative max-w-md">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Pesquisar ID ou tarefa para vincular..."
                      value={demandSearch}
                      onChange={(e) => {
                        setDemandSearch(e.target.value);
                        setShowDemandDropdown(true);
                      }}
                      onFocus={() => setShowDemandDropdown(true)}
                      className="w-full px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-lg placeholder-muted-foreground/60 focus:outline-none focus:border-primary transition"
                    />
                    {demandSearch && (
                      <button
                        type="button"
                        onClick={() => { setDemandSearch(''); setShowDemandDropdown(false); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown results */}
                  {showDemandDropdown && demandSearch.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto bg-popover border border-border rounded-xl shadow-xl p-1 space-y-0.5">
                      {loadingDemands ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground animate-pulse">Carregando...</div>
                      ) : unlinkedDemands.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground italic">Nenhuma demanda encontrada</div>
                      ) : (
                        unlinkedDemands.slice(0, 8).map(d => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => handleLinkDemand(d.id)}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-muted flex flex-col gap-0.5 transition"
                          >
                            <span className="font-semibold text-foreground">{d.demandId || '#Sem ID'} - {d.task}</span>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase">{d.operation} • {d.status}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* List of currently linked demands */}
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {relatedDemandIds.map(dId => {
                    const demand = demands.find(d => d.id === dId);
                    if (!demand) return null;
                    const op = operations.find(o => o.name.toLowerCase() === demand.operation.toLowerCase());
                    const colors = getOperationColor(demand.operation, op?.color);

                    return (
                      <div
                        key={dId}
                        className={cn(
                          "flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full border text-[10px] font-semibold transition-all hover:border-rose-500/30",
                          colors.bg, colors.text, "border-current/20"
                        )}
                      >
                        <span>{demand.demandId || '#Sem ID'} - {demand.task}</span>
                        <button
                          type="button"
                          onClick={() => handleUnlinkDemand(dId)}
                          className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-current/80 hover:text-current transition-colors"
                          title="Desvincular demanda"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  {relatedDemandIds.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">
                      Nenhuma demanda vinculada. Use a busca acima para vincular.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TipTap Rich Editor */}
        <div className="flex-1 min-h-[400px]">
          <TiptapEditor
            value={content}
            onChange={(val) => {
              setContent(val);
              pendingRef.current.content = val;
              schedule();
            }}
            placeholder="Comece a redigir seu documento de analista..."
          />
        </div>
      </div>
    </div>
  );
}
