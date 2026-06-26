'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DocumentationPage } from '@/types/index';
import { DOCUMENTATION_CATEGORIES } from '@/lib/constants';
import { GripVertical, Trash2, BookOpen } from 'lucide-react';
import { useConfirm } from '@/contexts/ConfirmModalContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DocumentationItemProps {
  page: DocumentationPage;
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: string) => Promise<void>;
  isDragEnabled: boolean;
}

export function DocumentationItem({
  page,
  isActive,
  onClick,
  onDelete,
  isDragEnabled,
}: DocumentationItemProps) {
  const { confirm } = useConfirm();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id, disabled: !isDragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : 'auto',
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Excluir documento',
      description: `Esta ação excluirá permanentemente o documento "${page.title}". Deseja continuar?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });

    if (confirmed) {
      try {
        await onDelete(page.id);
        toast.success('Documento excluído com sucesso');
      } catch (err) {
        toast.error('Erro ao excluir documento');
        console.error(err);
      }
    }
  };

  const categoryLabel = DOCUMENTATION_CATEGORIES.find(c => c.id === page.category)?.label ?? page.category;

  // Visual classes for different categories
  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case 'sistema':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/55';
      case 'processo':
        return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800/55';
      case 'requisito':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800/55';
      case 'regra_negocio':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/55';
      case 'procedimento':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/55';
      case 'troubleshooting':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/55';
      case 'integracao':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/55';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left cursor-pointer transition-all duration-200",
        isActive
          ? "bg-violet-500/10 border-violet-500/30 text-violet-900 dark:text-violet-100 shadow-sm"
          : "bg-card border-border hover:bg-muted/40 hover:border-border/80 text-foreground"
      )}
    >
      {/* Drag handle */}
      {isDragEnabled && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center p-1 rounded hover:bg-muted text-muted-foreground/60 group-hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Content wrapper */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-1.5 mb-1">
          <BookOpen className={cn("w-3.5 h-3.5 flex-shrink-0", isActive ? "text-violet-500" : "text-muted-foreground/80")} />
          <span className="font-semibold text-xs truncate leading-snug">
            {page.title || <span className="italic text-muted-foreground/60">Sem título</span>}
          </span>
        </div>
        
        {/* Category tag */}
        <span className={cn(
          "inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded border uppercase tracking-wide",
          getCategoryStyles(page.category)
        )}>
          {categoryLabel.replace(' (BABOK)', '')}
        </span>
      </div>

      {/* Delete button (revealed on hover) */}
      <button
        type="button"
        onClick={handleDelete}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
        title="Excluir documento"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
