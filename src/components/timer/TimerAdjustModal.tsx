'use client';
import { useState, useEffect } from 'react';
import { formatDurationFull } from '@/lib/utils';
import { X, Plus, Minus, Clock, Check } from 'lucide-react';

interface TimerAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  secondsRecorded: number;
  onSave: (finalSeconds: number) => Promise<void>;
}

export function TimerAdjustModal({ isOpen, onClose, secondsRecorded, onSave }: TimerAdjustModalProps) {
  const [seconds, setSeconds] = useState(secondsRecorded);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [loading, setLoading] = useState(false);

  // Sync state with prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setSeconds(secondsRecorded);
      const h = Math.floor(secondsRecorded / 3600);
      const m = Math.floor((secondsRecorded % 3600) / 60);
      setHours(h);
      setMinutes(m);
    }
  }, [isOpen, secondsRecorded]);

  if (!isOpen) return null;

  const handleAdjust = (minutesDiff: number) => {
    const nextSeconds = Math.max(0, seconds + minutesDiff * 60);
    setSeconds(nextSeconds);
    const h = Math.floor(nextSeconds / 3600);
    const m = Math.floor((nextSeconds % 3600) / 60);
    setHours(h);
    setMinutes(m);
  };

  const handleManualChange = (h: number, m: number) => {
    const finalH = Math.max(0, h);
    const finalM = Math.min(59, Math.max(0, m));
    setHours(finalH);
    setMinutes(finalM);
    setSeconds(finalH * 3600 + finalM * 60);
  };

  const handleConfirm = async () => {
    setLoading(false);
    try {
      setLoading(true);
      await onSave(seconds);
      onClose();
    } catch {
      // toast shown by hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-popover border border-border rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5 mb-5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-500" />
            <h3 className="text-base font-bold text-foreground">Ajustar Tempo Registrado</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display */}
        <div className="flex flex-col items-center justify-center py-6 bg-muted/30 border border-border/50 rounded-xl mb-5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Tempo Atual
          </span>
          <span className="text-3xl font-bold font-mono text-foreground tracking-tight tabular-nums">
            {formatDurationFull(seconds)}
          </span>
        </div>

        {/* Adjust Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <button
            onClick={() => handleAdjust(-15)}
            className="flex items-center justify-center gap-1 py-2 text-sm font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-600 dark:text-red-400 transition"
          >
            <Minus className="w-3.5 h-3.5" /> 15m
          </button>
          <button
            onClick={() => handleAdjust(15)}
            className="flex items-center justify-center gap-1 py-2 text-sm font-semibold rounded-lg bg-green-500/10 hover:bg-green-500/15 border border-green-500/20 text-green-600 dark:text-green-400 transition"
          >
            <Plus className="w-3.5 h-3.5" /> 15m
          </button>
          <button
            onClick={() => handleAdjust(30)}
            className="flex items-center justify-center gap-1 py-2 text-sm font-semibold rounded-lg bg-green-500/10 hover:bg-green-500/15 border border-green-500/20 text-green-600 dark:text-green-400 transition"
          >
            <Plus className="w-3.5 h-3.5" /> 30m
          </button>
        </div>

        {/* Manual Fields */}
        <div className="flex items-center justify-center gap-3 bg-muted/20 border border-border/40 p-4 rounded-xl mb-6">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Horas</span>
            <input
              type="number"
              value={hours}
              onChange={(e) => handleManualChange(parseInt(e.target.value) || 0, minutes)}
              className="w-16 bg-background border border-border rounded-lg text-center py-1.5 font-mono font-bold text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <span className="text-xl font-bold font-mono text-muted-foreground mt-4">:</span>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Minutos</span>
            <input
              type="number"
              value={minutes}
              onChange={(e) => handleManualChange(hours, parseInt(e.target.value) || 0)}
              className="w-16 bg-background border border-border rounded-lg text-center py-1.5 font-mono font-bold text-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 border-t border-border/60 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 transition disabled:opacity-60"
          >
            <Check className="w-4 h-4" /> Confirmar
          </button>
        </div>

      </div>
    </div>
  );
}
