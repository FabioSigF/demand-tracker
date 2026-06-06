'use client';
import { useAlarms } from '@/hooks/useAlarms';
import { useNotifications } from '@/hooks/useNotifications';
import { AlarmForm } from '@/components/alarms/AlarmForm';
import { AlarmList } from '@/components/alarms/AlarmList';
import { Bell, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function AlarmsPage() {
  const { alarms, loading, addAlarm, removeAlarm } = useAlarms();
  const { requestPermission } = useNotifications();
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    setPermissionState(result);
    if (result === 'granted') {
      toast.success('Notificações ativadas com sucesso!');
    } else if (result === 'denied') {
      toast.error('Permissão de notificações recusada. Ative manualmente no seu navegador.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      
      {/* Notifications Permission Banner */}
      {permissionState !== 'granted' ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-2xl shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Permissão de Notificação Necessária</h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Para receber alertas ao vivo na sua tela, ative as notificações do navegador.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestPermission}
            className="text-xs font-semibold px-4 py-2 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-500 text-slate-900 dark:text-slate-100 rounded-xl transition shadow-md shadow-yellow-500/10 shrink-0 self-end sm:self-center"
          >
            Ativar Alertas
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 p-3 rounded-2xl text-xs text-green-600 dark:text-green-400 font-semibold shadow-sm w-fit">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Alertas do navegador ativados e prontos
        </div>
      )}

      {/* Main Grid: Form and List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Form */}
        <div className="md:col-span-1">
          <AlarmForm onAdd={addAlarm} />
        </div>

        {/* Right Column: List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2.5">
            <Bell className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-bold text-foreground">Cronograma de Alertas ({alarms.length})</h2>
          </div>
          
          <AlarmList
            alarms={alarms}
            loading={loading}
            onDelete={removeAlarm}
          />
        </div>

      </div>

    </div>
  );
}
