'use client';
import { useState } from 'react';
import { useAnalytics, PeriodFilter, AnalyticsFilters } from '@/hooks/useAnalytics';
import { KPICard } from '@/components/analytics/KPICard';
import { TimeByOperationChart } from '@/components/analytics/TimeByOperationChart';
import { TimeByDayChart } from '@/components/analytics/TimeByDayChart';
import { TimeByDemandTable } from '@/components/analytics/TimeByDemandTable';
import { formatDuration, formatDateFull } from '@/lib/utils';
import { Clock, Timer, Calendar, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: 'week',
  });

  const {
    timeByOperation,
    timeByDemand,
    timeByDay,
    totalSeconds,
    daysWithRecords,
    loading,
    from,
    to,
  } = useAnalytics(filters);

  const handlePeriodChange = (period: PeriodFilter) => {
    setFilters(prev => ({
      ...prev,
      period,
      from: period === 'custom' ? prev.from : undefined,
      to:   period === 'custom' ? prev.to   : undefined,
    }));
  };

  const handleCustomDateChange = (field: 'from' | 'to', value: string) => {
    if (!value) return;
    setFilters(prev => ({
      ...prev,
      [field]: new Date(value + 'T12:00:00'),
    }));
  };

  // Média diária — só divide pelos dias com registros efetivos
  const avgDaily = daysWithRecords > 0
    ? Math.round(totalSeconds / daysWithRecords)
    : 0;

  return (
    <div className="p-6 space-y-6">

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">

        {/* Seleção de período */}
        <div className="flex items-center gap-1.5 bg-muted p-0.5 rounded-lg text-sm select-none">
          {(['today', 'week', 'month', 'custom'] as PeriodFilter[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-3 py-1.5 rounded-md font-semibold capitalize transition ${
                filters.period === p
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Personalizado'}
            </button>
          ))}
        </div>

        {/* Datas customizadas */}
        {filters.period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span>De:</span>
              <input
                type="date"
                value={filters.from ? filters.from.toISOString().split('T')[0] : ''}
                onChange={(e) => handleCustomDateChange('from', e.target.value)}
                className="bg-muted border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span>Até:</span>
              <input
                type="date"
                value={filters.to ? filters.to.toISOString().split('T')[0] : ''}
                onChange={(e) => handleCustomDateChange('to', e.target.value)}
                className="bg-muted border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              />
            </div>
          </div>
        )}

        {/* Label do período */}
        <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          Período: {formatDateFull(from)} a {formatDateFull(to)}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" />
          Processando dados estatísticos...
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Tempo Total no Período"
              value={formatDuration(totalSeconds)}
              icon={Clock}
              description="Soma de todos os registros finalizados"
              iconColorClass="text-violet-500 bg-violet-600/10"
            />
            <KPICard
              title="Média Diária"
              value={formatDuration(avgDaily)}
              icon={Timer}
              description={`Com base em ${daysWithRecords} dia${daysWithRecords !== 1 ? 's' : ''} com registros`}
              iconColorClass="text-blue-500 bg-blue-600/10"
            />
            <KPICard
              title="Dias com Registros"
              value={daysWithRecords}
              icon={Calendar}
              description="Quantidade de dias com horas lançadas"
              iconColorClass="text-yellow-500 bg-yellow-600/10"
            />
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TimeByOperationChart data={timeByOperation} />
            <TimeByDayChart data={timeByDay} />
          </div>

          {/* Tabela detalhada por demanda */}
          <TimeByDemandTable
            data={timeByDemand}
            totalSeconds={totalSeconds}
          />
        </>
      )}
    </div>
  );
}