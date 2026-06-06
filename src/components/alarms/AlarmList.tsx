'use client';
import { Alarm } from '@/types';
import { formatDateFull, formatDateShort } from '@/lib/utils';
import { Bell, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlarmListProps {
  alarms: Alarm[];
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
}

export function AlarmList({ alarms, loading, onDelete }: AlarmListProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-sm">
        Carregando alarmes...
      </div>
    );
  }

  if (alarms.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-sm">
        Nenhum alarme programado no momento.
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir este alarme permanentemente?')) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-3">
      {alarms.map((alarm) => {
        const date = alarm.scheduledAt.toDate();
        const formattedDate = format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
        const formattedTime = format(date, 'HH:mm');
        const isFired = alarm.fired;

        return (
          <div
            key={alarm.id}
            className={`flex items-start justify-between gap-4 p-4 border rounded-xl shadow-sm transition ${
              isFired
                ? 'bg-muted/10 border-border/40 opacity-60'
                : 'bg-card border-border hover:border-violet-500/30'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isFired
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-violet-600/10 text-violet-500 animate-pulse'
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-bold text-foreground truncate">{alarm.title}</h4>
                  {isFired && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      Disparado
                    </span>
                  )}
                </div>
                {alarm.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">{alarm.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formattedDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formattedTime}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDelete(alarm.id)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition shrink-0"
              title="Excluir alarme"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
