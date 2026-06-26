'use client';
import { useState } from 'react';
import { useOperations } from '@/hooks/useOperations';
import { ConfirmModal } from '@/components/layout/ConfirmModal';
import { COLOR_SCHEMES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { OperationBadge } from '@/components/demands/OperationBadge';
import { 
  Building2, Plus, Pencil, Trash2, Check, X, ShieldAlert,
  Loader2, Settings2
} from 'lucide-react';

export default function SettingsPage() {
  const { 
    operations, 
    loading, 
    addOperation, 
    editOperation, 
    removeOperation 
  } = useOperations();

  // Estados locais para criação
  const [newOpName, setNewOpName] = useState('');
  const [selectedColor, setSelectedColor] = useState('sky');
  const [isCreating, setIsCreating] = useState(false);

  // Estados locais para edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('sky');

  // Estados locais para exclusão (ConfirmModal)
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dividir operações em Padrão e Personalizadas
  const defaultOps = operations.filter(op => op.isDefault);
  const customOps = operations.filter(op => !op.isDefault);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName.trim()) return;
    await addOperation(newOpName, selectedColor);
    setNewOpName('');
    setSelectedColor('sky');
    setIsCreating(false);
  };

  const handleStartEdit = (id: string, name: string, color?: string) => {
    setEditingId(id);
    setEditingName(name);
    setEditingColor(color || 'sky');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    await editOperation(id, editingName, editingColor);
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await removeOperation(deleteId);
    setIsDeleting(false);
    setDeleteId(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Wrapper Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1">
          <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Menu de Ajustes
          </div>
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium bg-violet-600/10 text-violet-500 dark:text-violet-400 text-left transition">
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Operações</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Card Principal */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            
            {/* Header do Card */}
            <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between flex-wrap gap-4 bg-muted/10">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Settings2 className="w-4.5 h-4.5 text-violet-500" />
                  Gerenciamento de Operações
                </h3>
                <p className="text-xs text-muted-foreground">
                  Adicione e organize as operações utilizadas nas suas demandas e cronômetros.
                </p>
              </div>

              {/* Botão de Criação */}
              {!isCreating && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-md shadow-violet-500/15"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Operação
                </button>
              )}
            </div>

            {/* Corpo / Formulário e Listas */}
            <div className="p-5 sm:p-6 space-y-6">
              
              {/* Formulário de Criação Inline */}
              {isCreating && (
                <form 
                  onSubmit={handleCreate}
                  className="bg-muted/30 border border-border p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">Nova Operação Personalizada</h4>
                    <button 
                      type="button" 
                      onClick={() => setIsCreating(false)}
                      className="text-muted-foreground hover:text-foreground transition p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newOpName}
                      onChange={(e) => setNewOpName(e.target.value)}
                      placeholder="Ex: XP Investimentos, Stone Co..."
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!newOpName.trim()}
                      className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
                    >
                      Salvar
                    </button>
                  </div>
                  
                  {/* Grid de Cores */}
                  <div className="space-y-1.5 pt-1.5 border-t border-border/50">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Selecione a Cor da Operação
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {Object.entries(COLOR_SCHEMES).map(([key, value]) => {
                        const isSelected = selectedColor === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedColor(key)}
                            className={cn(
                              "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold transition-all text-left",
                              isSelected 
                                ? "border-violet-500 ring-2 ring-violet-500/20 bg-violet-500/5" 
                                : "border-border/60 bg-card hover:bg-muted/30"
                            )}
                          >
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium border border-current/10 shadow-sm shrink-0',
                                value.bg,
                                value.text
                              )}
                            >
                              <span className={cn('w-1 h-1 rounded-full shrink-0', value.dot)} />
                              <span>Cor</span>
                            </span>
                            <span className="text-[9px] font-medium text-muted-foreground truncate">{value.label.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                  <span>Carregando operações...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Operações Padrão */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Operações do Sistema
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {defaultOps.map((op) => (
                        <div 
                          key={op.id}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-sm font-medium text-foreground/80"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="truncate">{op.name}</span>
                            <OperationBadge operation={op.name} />
                          </div>
                          <span className="text-[10px] font-semibold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-md uppercase shrink-0">
                            Padrão
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Separador */}
                  {customOps.length > 0 && <div className="border-t border-border/60" />}

                  {/* Operações Personalizadas */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Minhas Operações
                    </div>
                    
                    {customOps.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-border rounded-xl text-xs text-muted-foreground space-y-1 bg-muted/10">
                        <p>Nenhuma operação personalizada cadastrada.</p>
                        <p className="text-[10px]">As operações padrão do sistema estão prontas para uso.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50 border border-border rounded-xl overflow-hidden bg-background">
                        {customOps.map((op) => {
                          const isEditing = editingId === op.id;
                          return (
                            <div 
                              key={op.id}
                              className="flex items-center justify-between p-3 gap-4 text-sm font-medium hover:bg-muted/15 transition"
                            >
                              {isEditing ? (
                                <div className="flex-1 flex flex-col gap-2.5 p-1 animate-in fade-in duration-150">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={editingName}
                                      onChange={(e) => setEditingName(e.target.value)}
                                      className="flex-1 bg-background border border-border rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleSaveEdit(op.id)}
                                      disabled={!editingName.trim()}
                                      className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition"
                                      title="Confirmar alteração"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="p-1.5 bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground rounded-lg transition"
                                      title="Cancelar"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  {/* Selector de cor na edição */}
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Alterar Cor</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {Object.entries(COLOR_SCHEMES).map(([key, val]) => (
                                        <button
                                          key={key}
                                          type="button"
                                          onClick={() => setEditingColor(key)}
                                          className={cn(
                                            "w-5 h-5 rounded-full border transition active:scale-[0.85] flex items-center justify-center",
                                            editingColor === key ? "border-violet-500 scale-110 ring-2 ring-violet-500/25" : "border-border",
                                            val.dot
                                          )}
                                          title={val.label}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="text-foreground truncate">{op.name}</span>
                                    <OperationBadge operation={op.name} />
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => handleStartEdit(op.id, op.name, op.color)}
                                      className="p-1.5 text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 rounded-lg transition"
                                      title="Editar"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteId(op.id)}
                                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                                      title="Excluir operação"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>
          
        </div>
      </div>

      {/* Modal de Confirmação para Exclusão */}
      <ConfirmModal
        open={!!deleteId}
        title="Deseja excluir esta operação?"
        description="A exclusão removerá esta opção dos seletores. As demandas e tarefas que já utilizam esta operação continuarão exibindo o nome normalmente."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />

    </div>
  );
}
