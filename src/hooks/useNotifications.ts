'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useAlarms } from './useAlarms';
import { markAlarmFired } from '@/services/alarms.service';
import { Alarm } from '@/types';

export function useNotifications() {
  const { alarms } = useAlarms();
  const permissionRef = useRef<NotificationPermission>('default');

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied' as NotificationPermission;
    const result = await Notification.requestPermission();
    permissionRef.current = result;
    return result;
  }, []);

  const showNotification = useCallback((alarm: Alarm) => {
    if (permissionRef.current !== 'granted') return;
    new Notification(alarm.title, {
      body: alarm.description || 'Lembrete agendado',
      icon: '/favicon.ico',
    });
  }, []);

  useEffect(() => {
    if (!('Notification' in window)) return;
    permissionRef.current = Notification.permission;

    const interval = setInterval(() => {
      const now = Date.now();
      alarms.forEach(alarm => {
        if (alarm.fired) return;
        const scheduledMs = alarm.scheduledAt.toDate().getTime();
        if (now >= scheduledMs && now - scheduledMs < 60000) {
          showNotification(alarm);
          markAlarmFired(alarm.id);
        }
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [alarms, showNotification]);

  return { requestPermission };
}
