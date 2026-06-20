'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import AuthGuard from '@/components/AuthGuard';
import { useTimerSync } from '@/hooks/useTimer';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const NotepadWidget = dynamic(
  () =>
    import('@/components/notepad/NotepadWidget').then(
      (mod) => mod.NotepadWidget
    ),
  {
    ssr: false,
  }
);

import { useState } from 'react';
import { GlobalAlarmManager } from '@/components/alarms/GlobalAlarmManager';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useTimerSync();

  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  let pageTitle = 'Dashboard';

  if (pathname.startsWith('/demands')) {
    pageTitle = 'Quadro de Demandas';
  } else if (pathname.startsWith('/analytics')) {
    pageTitle = 'Indicadores & Relatórios';
  } else if (pathname.startsWith('/alarms')) {
    pageTitle = 'Alarmes & Lembretes';
  } else if (pathname.startsWith('/download')) {
    pageTitle = 'Instalar Aplicativo (PWA)';
  }

  return (
    <AuthGuard>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

        <div className="flex flex-col flex-1 h-full min-w-0">
          <Header title={pageTitle} onMenuClick={() => setMobileSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto min-h-0 bg-background/30">
            {children}
          </main>

          <NotepadWidget />
          <GlobalAlarmManager />
        </div>
      </div>
    </AuthGuard>
  );
}