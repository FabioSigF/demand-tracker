'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDemands } from '@/hooks/useDemands';
import { DemandRow } from './DemandRow';
import { DemandFilters, FilterState } from './DemandFilters';
import { DemandDrawer } from './DemandDrawer';
import { TimerAdjustModal } from '../timer/TimerAdjustModal';
import { Plus, ArrowUpDown, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { isDelayed } from '@/lib/utils';

export function DemandsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    demands,
    activeDemands,
    doneDemands,
    loading,
    addDemand,
    editDemand,
    removeDemand,
    reorder,
  } = useDemands();

  const [activeTab, setActiveTab] = useState<'active' | 'done'>('active');

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    operation: 'Todos',
    status: 'Todos',
    onlyDelayed: false,
  });

  const [sortField, setSortField] = useState<'operation' | 'startDate' | 'status' | 'order'>('order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ── Drawer state ──────────────────────────────────────────────────────────
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  /**
   * selectedDemand é DERIVADO de demands (objeto vivo).
   * Nunca é um snapshot congelado — sempre reflete o Firestore atual.
   */
  const selectedDemand = useMemo(
    () => demands.find(d => d.id === selectedDemandId) ?? null,
    [demands, selectedDemandId]
  );

  /**
   * Ref para o callback de save do Drawer.
   * O Drawer expõe uma função saveNow via este ref para que o pai
   * possa aguardar o save ANTES de limpar o selectedDemandId.
   *
   * Isso resolve o bug onde handleCloseDrawer era síncrono e
   * limpava o estado antes do save async terminar.
   */
  const drawerSaveRef = useRef<(() => Promise<boolean>) | null>(null);

  /**
   * Fecha o drawer aguardando o save ser concluído antes de
   * limpar selectedDemandId. Caso contrário, demandIdRef no Drawer
   * seria nulado pelo re-render causado pelo setSelectedDemandId(null)
   * enquanto o save ainda estaria em andamento.
   */
  const handleCloseDrawer = useCallback(async () => {
    // O Drawer já chama saveNow internamente no handleClose.
    // Aqui apenas aguardamos ele terminar antes de limpar o estado.
    setIsDrawerOpen(false);
    // Dá um tick para o Drawer processar o close e terminar o save
    // antes de remover a demanda do estado (o que causaria demand = null)
    await new Promise(resolve => setTimeout(resolve, 100));
    setSelectedDemandId(null);
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const [adjustTimerData, setAdjustTimerData] = useState<{
    isOpen: boolean;
    seconds: number;
    saveFn: (finalSeconds: number) => Promise<number>;
  }>({
    isOpen: false,
    seconds: 0,
    saveFn: async () => 0,
  });

  // Handle opening demand via query params (Global Search)
  const openParam = searchParams.get('open');
  useEffect(() => {
    if (openParam && demands.length) {
      const match = demands.find(d => d.id === openParam);
      if (match) {
        if (['Concluído', 'Cancelado'].includes(match.status)) {
          setActiveTab('done');
        } else {
          setActiveTab('active');
        }
        setSelectedDemandId(match.id);
        setIsDrawerOpen(true);
        const params = new URLSearchParams(searchParams);
        params.delete('open');
        router.replace(`/demands?${params.toString()}`);
      }
    }
  }, [openParam, demands, router, searchParams]);

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

    const list = activeTab === 'active' ? activeDemands : doneDemands;
    const oldIndex = list.findIndex((item) => item.id === active.id);
    const newIndex = list.findIndex((item) => item.id === over.id);
    const reorderedList = arrayMove(list, oldIndex, newIndex);

    const updates = reorderedList.map((item, index) => ({
      id: item.id,
      order: (index + 1) * 1000,
    }));

    try {
      await reorder(updates);
    } catch {
      toast.error('Erro ao reordenar demandas');
    }
  };

  const handleCreateDemand = async () => {
    try {
      const newId = await addDemand();
      if (newId) {
        toast.success('Nova linha criada. Edite os campos diretamente.');
        setSelectedDemandId(newId);
        setIsDrawerOpen(true);
      }
    } catch {
      toast.error('Erro ao criar demanda');
    }
  };

  const handleStopTimer = (seconds: number, stopFn: (finalSeconds: number) => Promise<number>) => {
    setAdjustTimerData({ isOpen: true, seconds, saveFn: stopFn });
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const currentList = activeTab === 'active' ? activeDemands : doneDemands;

  const filteredDemands = currentList.filter(d => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const matchesSearch =
        d.demandId.toLowerCase().includes(s) ||
        d.operation.toLowerCase().includes(s) ||
        d.task.toLowerCase().includes(s) ||
        d.notes.toLowerCase().includes(s);
      if (!matchesSearch) return false;
    }
    if (filters.operation !== 'Todos' && d.operation !== filters.operation) return false;
    if (filters.status !== 'Todos' && d.status !== filters.status) return false;
    if (filters.onlyDelayed && !isDelayed(d.deadline, d.status)) return false;
    if (filters.startDate) {
      const from = new Date(filters.startDate + 'T00:00:00').getTime();
      const ts = d.startDate?.toDate().getTime() || 0;
      if (ts < from) return false;
    }
    if (filters.endDate) {
      const to = new Date(filters.endDate + 'T23:59:59').getTime();
      const ts = d.startDate?.toDate().getTime() || 0;
      if (ts > to) return false;
    }
    return true;
  });

  const sortedDemands = [...filteredDemands].sort((a, b) => {
    if (sortField === 'order') {
      return sortDirection === 'asc' ? a.order - b.order : b.order - a.order;
    }
    let valA: string | number = '';
    let valB: string | number = '';
    if (sortField === 'operation') { valA = a.operation; valB = b.operation; }
    else if (sortField === 'status') { valA = a.status; valB = b.status; }
    else if (sortField === 'startDate') {
      valA = a.startDate?.toDate().getTime() || 0;
      valB = b.startDate?.toDate().getTime() || 0;
    }
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const isDragEnabled =
    sortField === 'order' &&
    filters.search === '' &&
    filters.operation === 'Todos' &&
    filters.status === 'Todos' &&
    !filters.onlyDelayed &&
    !filters.startDate &&
    !filters.endDate;

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-background/50">

      {/* Upper bar */}
      <div className="flex items-center justify-between border-b border-border bg-card/40 px-6 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'active'
              ? 'bg-violet-600/10 text-violet-500'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Clock className="w-4 h-4" />
            Em Atendimento
            <span className="bg-slate-200 dark:bg-slate-800 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full">
              {activeDemands.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('done')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${activeTab === 'done'
              ? 'bg-violet-600/10 text-violet-500'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <CheckCircle className="w-4 h-4" />
            Finalizadas
            <span className="bg-slate-200 dark:bg-slate-800 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full">
              {doneDemands.length}
            </span>
          </button>
        </div>

        <button
          onClick={handleCreateDemand}
          className="flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4.5 py-2 rounded-xl transition shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          Nova Demanda
        </button>
      </div>

      {/* Filter panel */}
      <div className="px-6 pt-4 shrink-0">
        <DemandFilters
          filters={filters}
          onChange={setFilters}
          showStatusFilter={false}
        />
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto px-6 pb-6 min-h-0">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
          <div className="flex-1 overflow-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full border-collapse text-left table-fixed min-w-[1000px]">
                <thead className="bg-muted border-b border-border sticky top-0 z-10 select-none">
                  <tr className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    <th className="p-2 w-8"></th>
                    <th className="p-2 w-24">ID</th>
                    <th
                      onClick={() => handleSort('operation')}
                      className="p-2 w-36 cursor-pointer hover:bg-muted/50 transition group"
                    >
                      <span className="flex items-center gap-1">
                        Operação
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </th>
                    <th className="p-2 min-w-[200px]">Tarefa</th>
                    <th
                      onClick={() => handleSort('startDate')}
                      className="p-2 w-28 cursor-pointer hover:bg-muted/50 transition group"
                    >
                      <span className="flex items-center gap-1">
                        Início
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </th>
                    <th className="p-2 w-28">
                      {activeTab === 'done' ? 'Finalizado' : 'Prazo'}
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="p-2 w-36 cursor-pointer hover:bg-muted/50 transition group"
                    >
                      <span className="flex items-center gap-1">
                        Status
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </th>
                    <th className="p-2 min-w-[400px]">Anotações Rápidas</th>
                    <th className="p-2 w-30">Tempo</th>
                    <th className="p-2 w-20 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        Carregando demandas...
                      </td>
                    </tr>
                  ) : sortedDemands.length > 0 ? (
                    <SortableContext
                      items={sortedDemands.map(d => d.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sortedDemands.map((demand) => (
                        <DemandRow
                          key={demand.id}
                          demand={demand}
                          showCompletedDate={activeTab === 'done'}
                          onDelete={removeDemand}
                          onOpenDetails={(d) => {
                            setSelectedDemandId(d.id);
                            setIsDrawerOpen(true);
                          }}
                          onStopTimerClick={handleStopTimer}
                          isDragEnabled={isDragEnabled}
                        />
                      ))}
                    </SortableContext>
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        Nenhuma demanda localizada nesta visualização.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </DndContext>
          </div>
        </div>
      </div>

      {/* Details Sidebar Drawer */}
      <DemandDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        demand={selectedDemand}
        onUpdate={editDemand}
      />

      {/* Timer Adjust Modal */}
      <TimerAdjustModal
        isOpen={adjustTimerData.isOpen}
        onClose={() => setAdjustTimerData(prev => ({ ...prev, isOpen: false }))}
        secondsRecorded={adjustTimerData.seconds}
        onSave={async (secs) => { await adjustTimerData.saveFn(secs); }}
      />
    </div>
  );
}