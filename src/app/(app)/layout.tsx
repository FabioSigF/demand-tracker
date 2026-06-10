'use client';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import AuthGuard from '@/components/AuthGuard';
import { useTimerSync } from '@/hooks/useTimer';
import { useNotifications } from '@/hooks/useNotifications';
import { usePathname } from 'next/navigation';
import { NotepadWidget } from '@/components/notepad/NotepadWidget';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Sync background timers from firestore to React Context
  useTimerSync();

  // Initialize browser notification scheduler
  const { requestPermission } = useNotifications();

  const pathname = usePathname();

  // Determine dynamic title for header
  let pageTitle = 'Dashboard';
  if (pathname.startsWith('/demands')) pageTitle = 'Quadro de Demandas';
  else if (pathname.startsWith('/analytics')) pageTitle = 'Indicadores & Relatórios';
  else if (pathname.startsWith('/alarms')) pageTitle = 'Alarmes & Lembretes';

  // Request browser notification permissions on mount
  return (
    <AuthGuard>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Wrapper */}
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
