'use client';
import { useDemands } from '@/hooks/useDemands';
import { useAnalytics } from '@/hooks/useAnalytics';
import { KPICard } from '@/components/analytics/KPICard';
import { formatDuration } from '@/lib/utils';
import {
  Clock, CheckCircle2, AlertTriangle, Play, CalendarDays,
  FilePlus, ClipboardList, BellRing
} from 'lucide-react';
import Link from 'next/link';
import { isDelayed } from '@/lib/utils';

export default function DashboardPage() {
  const { demands, activeDemands, doneDemands, loading: loadingDemands } = useDemands();
  
  // Get analytics for today
  const { totalSeconds: secondsToday, loading: loadingToday } = useAnalytics({ period: 'today' });
  
  // Get analytics for week
  const { totalSeconds: secondsWeek, loading: loadingWeek } = useAnalytics({ period: 'week' });

  // Calculate delayed count
  const delayedCount = activeDemands.filter(d => isDelayed(d.deadline, d.status)).length;

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Olá! Bem-vindo de volta.</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Aqui está um resumo das suas atividades e demandas.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Demands */}
        <KPICard
          title="Em Atendimento"
          value={loadingDemands ? '...' : activeDemands.length}
          icon={Clock}
          description="Pendentes ou Em andamento"
          iconColorClass="text-blue-500 bg-blue-600/10"
        />

        {/* Finished Demands */}
        <KPICard
          title="Finalizadas"
          value={loadingDemands ? '...' : doneDemands.length}
          icon={CheckCircle2}
          description="Concluídas ou Canceladas"
          iconColorClass="text-green-500 bg-green-600/10"
        />

        {/* Delayed Demands */}
        <KPICard
          title="Atrasadas"
          value={loadingDemands ? '...' : delayedCount}
          icon={AlertTriangle}
          description="Prazo expirado"
          iconColorClass={delayedCount > 0 ? 'text-red-500 bg-red-600/10' : 'text-gray-500 bg-gray-600/10'}
        />

        {/* Time Registered Today */}
        <KPICard
          title="Hoje"
          value={loadingToday ? '...' : formatDuration(secondsToday)}
          icon={Play}
          description="Tempo registrado hoje"
          iconColorClass="text-violet-500 bg-violet-600/10"
        />

        {/* Time Registered Week */}
        <KPICard
          title="Esta Semana"
          value={loadingWeek ? '...' : formatDuration(secondsWeek)}
          icon={CalendarDays}
          description="Segunda a Domingo"
          iconColorClass="text-yellow-500 bg-yellow-600/10"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Go to demands */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-violet-500/30 transition group">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-violet-600/10 text-violet-500 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Gerenciar Demandas</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Crie novas demandas, atualize o status inline, controle o tempo com o cronômetro persistente e documente histórias.
            </p>
          </div>
          <Link
            href="/demands"
            className="mt-4 text-xs font-semibold text-violet-500 hover:text-violet-600 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            Acessar Demandas →
          </Link>
        </div>

        {/* Card 2: Go to analytics */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-violet-500/30 transition group">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Indicadores de Desempenho</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Visualize gráficos detalhados de horas registradas por dia ou por operação. Analise períodos personalizados.
            </p>
          </div>
          <Link
            href="/analytics"
            className="mt-4 text-xs font-semibold text-violet-500 hover:text-violet-600 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            Acessar Analytics →
          </Link>
        </div>

        {/* Card 3: Go to alarms */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-violet-500/30 transition group">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-yellow-600/10 text-yellow-500 rounded-xl flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Alarmes & Lembretes</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Agende alarmes para reuniões, checkpoints e atividades com notificações automáticas integradas diretamente no navegador.
            </p>
          </div>
          <Link
            href="/alarms"
            className="mt-4 text-xs font-semibold text-violet-500 hover:text-violet-600 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            Acessar Alarmes →
          </Link>
        </div>

      </div>
    </div>
  );
}
