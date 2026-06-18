'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import AuthGuard from '@/components/AuthGuard';
import { useTimerSync } from '@/hooks/useTimer';
import { useNotifications } from '@/hooks/useNotifications';
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

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useTimerSync();

  const { requestPermission } = useNotifications();

  const pathname = usePathname();

  let pageTitle = 'Dashboard';

  if (pathname.startsWith('/demands')) {
    pageTitle = 'Quadro de Demandas';
  } else if (pathname.startsWith('/analytics')) {
    pageTitle = 'Indicadores & Relatórios';
  } else if (pathname.startsWith('/alarms')) {
    pageTitle = 'Alarmes & Lembretes';
  }

  return (
    <AuthGuard>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar />

        <div className="flex flex-col flex-1 h-full min-w-0">
          <Header title={pageTitle} />

          <main className="flex-1 overflow-y-auto min-h-0 bg-background/30">
            {children}
          </main>

          <NotepadWidget />
        </div>
      </div>
    </AuthGuard>
  );
}