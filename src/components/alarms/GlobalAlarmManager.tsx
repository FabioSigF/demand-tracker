'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { subscribeToAlarms, triggerAlarm, acknowledgeAlarm, snoozeAlarm } from '@/services/alarms.service';
import { Alarm } from '@/types';
import { toast } from 'sonner';
import { Bell, Clock, Check, Volume2, VolumeX, AlertTriangle } from 'lucide-react';

export function GlobalAlarmManager() {
  const { user } = useAuthContext();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Audio references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthIntervalRef = useRef<any>(null);
  const audioCtxRef = useRef<any>(null);

  // Subscribe to Firestore alarms
  useEffect(() => {
    if (!user) {
      setAlarms([]);
      setActiveAlarm(null);
      return;
    }

    const unsubscribe = subscribeToAlarms(user.uid, (data) => {
      setAlarms(data);
    });

    return unsubscribe;
  }, [user]);

  // Play alarm sound (synth beep + HTML audio fallback)
  const playSound = () => {
    if (isMuted) return;

    // Try HTML Audio
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/alarm.mp3');
      audioRef.current.loop = true;
    }

    audioRef.current.play().catch(() => {
      // Fallback to Web Audio Synthesizer if file is missing or blocked by browser autopilot
      startSynthBeep();
    });
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    stopSynthBeep();
  };

  const startSynthBeep = () => {
    if (synthIntervalRef.current) return;
    
    const playBeep = () => {
      if (isMuted) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = 880; // High-pitched A note
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch (e) {
        console.warn('Web Audio synthesis failed:', e);
      }
    };

    playBeep();
    synthIntervalRef.current = setInterval(playBeep, 2000); // Beep every 2 seconds
  };

  const stopSynthBeep = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  // Browser Desktop Notification
  const showDesktopNotification = (alarm: Alarm) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    const notification = new Notification('⏰ Alarme Disparado!', {
      body: `${alarm.title}\n${alarm.description || 'Lembrete agendado'}`,
      icon: '/icon-192.svg',
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
    };
  };

  // Main monitoring interval (runs every 2 seconds)
  useEffect(() => {
    const checkAlarms = () => {
      const now = Date.now();
      
      // 1. Detect if any alarm is triggered in Firestore, but not acknowledged by the user yet
      const activeUnacknowledged = alarms.find(
        (a) => a.isTriggered && !a.isAcknowledged
      );

      if (activeUnacknowledged) {
        if (!activeAlarm || activeAlarm.id !== activeUnacknowledged.id) {
          setActiveAlarm(activeUnacknowledged);
          playSound();
        }
        return;
      }

      // 2. Check if a pending alarm scheduled time has arrived
      const dueAlarm = alarms.find((alarm) => {
        if (alarm.fired || alarm.isTriggered) return false;
        const scheduledMs = alarm.scheduledAt.toDate().getTime();
        return now >= scheduledMs;
      });

      if (dueAlarm) {
        // Trigger the alarm in Firestore
        triggerAlarm(dueAlarm.id);
        
        // Show local desktop notification
        showDesktopNotification(dueAlarm);
        
        // Show backup Sonner Toast
        toast.info(`⏰ Alarme disparado: ${dueAlarm.title}`, {
          description: dueAlarm.description,
          duration: 10000,
        });

        setActiveAlarm(dueAlarm);
        playSound();
      }
    };

    const timer = setInterval(checkAlarms, 2000);
    return () => {
      clearInterval(timer);
      stopSound();
    };
  }, [alarms, activeAlarm, isMuted]);

  const handleDismiss = async () => {
    if (!activeAlarm) return;
    stopSound();
    const targetId = activeAlarm.id;
    setActiveAlarm(null);
    try {
      await acknowledgeAlarm(targetId);
      toast.success('Alarme dispensado');
    } catch {
      toast.error('Erro ao dispensar alarme');
    }
  };

  const handleSnooze = async (minutes: number) => {
    if (!activeAlarm) return;
    stopSound();
    const targetId = activeAlarm.id;
    const currentScheduled = activeAlarm.scheduledAt;
    setActiveAlarm(null);
    setSnoozeOpen(false);
    try {
      await snoozeAlarm(targetId, minutes, currentScheduled);
      toast.success(`Soneca ativada por ${minutes} minutos`);
    } catch {
      toast.error('Erro ao ativar soneca');
    }
  };

  // Request browser notification permissions on first load if default
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (!activeAlarm) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 select-none">
      <div className="bg-card border border-border/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-center relative overflow-hidden">
        {/* Glowing Background Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-violet-600 to-red-500 animate-pulse" />

        {/* Alarm Info */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-violet-500 flex items-center justify-center gap-1">
            <Bell className="w-3 h-3" />
            Lembrete
          </span>
          <h2 className="text-xl font-extrabold text-foreground px-4 truncate">
            {activeAlarm.title}
          </h2>
          <p className="text-xs text-muted-foreground font-medium tabular-nums flex items-center justify-center gap-1 bg-muted/50 w-fit mx-auto px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {activeAlarm.scheduledAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {activeAlarm.description && (
            <p className="text-xs text-muted-foreground leading-relaxed max-h-[80px] overflow-y-auto px-4 mt-2">
              {activeAlarm.description}
            </p>
          )}
        </div>

        {/* Buttons / Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-5 py-3 rounded-2xl transition shadow-lg shadow-violet-500/20 active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              Dispensar
            </button>

            <div className="relative flex-1">
              <button
                onClick={() => setSnoozeOpen(!snoozeOpen)}
                className="w-full flex items-center justify-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-sm px-5 py-3 rounded-2xl border border-border/80 transition active:scale-[0.98]"
              >
                <Clock className="w-4 h-4 text-violet-500" />
                Soneca...
              </button>

              {snoozeOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-full bg-popover border border-border rounded-xl shadow-xl py-1 z-50 divide-y divide-border/40 animate-in slide-in-from-bottom-2 duration-150">
                  <button
                    onClick={() => handleSnooze(5)}
                    className="w-full text-left px-4 py-2.5 text-xs text-foreground hover:bg-accent font-semibold transition"
                  >
                    Soneca 5 min
                  </button>
                  <button
                    onClick={() => handleSnooze(10)}
                    className="w-full text-left px-4 py-2.5 text-xs text-foreground hover:bg-accent font-semibold transition"
                  >
                    Soneca 10 min
                  </button>
                  <button
                    onClick={() => handleSnooze(15)}
                    className="w-full text-left px-4 py-2.5 text-xs text-foreground hover:bg-accent font-semibold transition"
                  >
                    Soneca 15 min
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mute toggle button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 justify-center self-center transition py-1"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3 h-3 text-red-500" />
                Som Desativado
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3 text-green-500 animate-pulse" />
                Som Ativo (Silenciar)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
