'use client';
import { useCallback, useRef } from 'react';

export function useNotifications() {
  const permissionRef = useRef<NotificationPermission>('default');

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied' as NotificationPermission;
    const result = await Notification.requestPermission();
    permissionRef.current = result;
    return result;
  }, []);

  return { requestPermission };
}
