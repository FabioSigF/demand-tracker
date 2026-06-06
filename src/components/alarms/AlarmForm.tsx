'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { alarmSchema, AlarmInput } from '@/lib/validations';
import { Bell, Calendar, Clock, FileText, Plus, Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useState } from 'react';

interface AlarmFormProps {
  onAdd: (data: { title: string; description?: string; scheduledAt: Timestamp }) => Promise<void>;
}

export function AlarmForm({ onAdd }: AlarmFormProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AlarmInput>({
    resolver: zodResolver(alarmSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
    },
  });

  const onSubmit = async (data: AlarmInput) => {
    setLoading(true);
    try {
      // Combine date and time to Date object
      const scheduledDate = new Date(`${data.date}T${data.time}:00`);
      await onAdd({
        title: data.title,
        description: data.description,
        scheduledAt: Timestamp.fromDate(scheduledDate),
      });
      reset({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
      });
    } catch {
      // toast shown by hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-2.5">
        <Bell className="w-4 h-4 text-violet-500" />
        <h2 className="text-sm font-bold text-foreground">Novo Alarme / Lembrete</h2>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Título do Alarme</label>
        <input
          type="text"
          {...register('title')}
          placeholder="Ex: Reunião Cielo com time..."
          className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-foreground"
        />
        {errors.title && <p className="text-red-400 text-xs">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Descrição (Opcional)</label>
        <textarea
          rows={2}
          {...register('description')}
          placeholder="Notas adicionais sobre a atividade..."
          className="w-full bg-muted/20 border border-border rounded-lg p-3 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-foreground resize-none"
        />
        {errors.description && <p className="text-red-400 text-xs">{errors.description.message}</p>}
      </div>

      {/* Date and Time Group */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Data
          </label>
          <input
            type="date"
            {...register('date')}
            className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-foreground"
          />
          {errors.date && <p className="text-red-400 text-xs">{errors.date.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Hora
          </label>
          <input
            type="time"
            {...register('time')}
            className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition text-foreground"
          />
          {errors.time && <p className="text-red-400 text-xs">{errors.time.message}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold py-2 rounded-lg transition shadow-lg shadow-violet-500/20"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {loading ? 'Criando...' : 'Criar Alarme'}
      </button>
    </form>
  );
}
