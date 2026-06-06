import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { Toaster } from 'sonner';
import { ConfirmModalProvider } from '@/contexts/ConfirmModalContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Demand Tracker',
  description: 'Plataforma de controle de demandas para Analistas de Negócio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <TimerProvider>
              <ConfirmModalProvider>
                {children}
                <Toaster richColors position="bottom-right" />
              </ConfirmModalProvider>
            </TimerProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
