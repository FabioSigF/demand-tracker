'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Download, Smartphone, Compass, Share, PlusSquare, 
  CheckCircle, Laptop, ShieldCheck, Zap
} from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function DownloadPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect device type
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceType('ios');
    } else if (/android/.test(ua)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4 mb-6">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar para o Login
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center gap-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-violet-600/10 text-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/5">
            <Download className="w-6 h-6 animate-bounce" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Instale o Demand Tracker
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Acesse o seu painel de demandas instantaneamente direto da sua tela inicial, sem precisar abrir o navegador.
          </p>
        </div>

        {/* Status Alert or Install Button */}
        <div className="max-w-md mx-auto w-full">
          {isInstalled ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4.5 rounded-2xl flex items-center gap-3.5 shadow-sm text-emerald-400">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <div className="text-left text-xs">
                <h4 className="font-bold text-foreground">Aplicativo Instalado!</h4>
                <p className="text-muted-foreground mt-0.5">O Demand Tracker já está disponível na sua lista de aplicativos.</p>
              </div>
            </div>
          ) : isInstallable ? (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-6 py-3 rounded-2xl transition shadow-lg shadow-violet-500/25 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Smartphone className="w-5 h-5" />
              Instalar Aplicativo Agora
            </button>
          ) : (
            <div className="bg-muted/40 border border-border p-4 rounded-2xl flex items-start gap-3 text-left">
              <Zap className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-foreground">Instalação Manual do Navegador</h4>
                <p className="text-muted-foreground leading-relaxed">
                  Seu navegador atual suporta PWA. Siga as instruções abaixo de acordo com seu dispositivo para adicionar o aplicativo à tela inicial.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Step-by-Step Instructions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          
          {/* iOS Card */}
          <div className={`bg-card border rounded-2xl p-5 space-y-4 shadow-sm transition ${
            deviceType === 'ios' ? 'border-violet-500/50 ring-1 ring-violet-500/20 bg-violet-950/5' : 'border-border'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center shrink-0 font-bold">
                iOS
              </div>
              <h3 className="font-bold text-sm text-foreground">Apple (iPhone / iPad)</h3>
            </div>
            
            <ol className="space-y-3.5 text-xs text-muted-foreground list-decimal pl-4.5">
              <li>Abra o site no navegador <strong>Safari</strong>.</li>
              <li>Tente localizar e clicar no ícone de <strong>Compartilhar</strong> <span className="inline-flex items-center align-middle bg-muted p-1 rounded"><Share className="w-3.5 h-3.5 text-foreground" /></span> no menu inferior.</li>
              <li>Role as opções para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> <span className="inline-flex items-center align-middle bg-muted p-1 rounded"><PlusSquare className="w-3.5 h-3.5 text-foreground" /></span>.</li>
              <li>Clique em <strong>"Adicionar"</strong> no canto superior direito.</li>
            </ol>
          </div>

          {/* Android Card */}
          <div className={`bg-card border rounded-2xl p-5 space-y-4 shadow-sm transition ${
            deviceType === 'android' ? 'border-violet-500/50 ring-1 ring-violet-500/20 bg-violet-950/5' : 'border-border'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-600/10 text-green-500 rounded-xl flex items-center justify-center shrink-0 font-bold">
                And
              </div>
              <h3 className="font-bold text-sm text-foreground">Android (Chrome / Samsung)</h3>
            </div>
            
            <ol className="space-y-3.5 text-xs text-muted-foreground list-decimal pl-4.5">
              <li>Abra o site no navegador <strong>Google Chrome</strong> ou Samsung Internet.</li>
              <li>Aguarde o pop-up de instalação ou clique nos <strong>três pontos</strong> do canto superior.</li>
              <li>Selecione a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
              <li>Confirme clicando em <strong>"Instalar"</strong> na tela de confirmação.</li>
            </ol>
          </div>

          {/* Desktop Card */}
          <div className={`bg-card border rounded-2xl p-5 space-y-4 shadow-sm transition ${
            deviceType === 'desktop' ? 'border-violet-500/50 ring-1 ring-violet-500/20 bg-violet-950/5' : 'border-border'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-600/10 text-violet-500 rounded-xl flex items-center justify-center shrink-0 font-bold">
                PC
              </div>
              <h3 className="font-bold text-sm text-foreground">Computador (Chrome / Edge)</h3>
            </div>
            
            <ol className="space-y-3.5 text-xs text-muted-foreground list-decimal pl-4.5">
              <li>Abra o site no <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>.</li>
              <li>Na barra de endereços (ao lado do link), clique no ícone de <strong>instalação</strong> (um monitor com seta para baixo).</li>
              <li>Ou clique no menu de três pontos e selecione <strong>"Instalar Demand Tracker..."</strong>.</li>
              <li>Confirme no botão <strong>"Instalar"</strong>.</li>
            </ol>
          </div>

        </div>

        {/* Advantages / Details */}
        <div className="border-t border-border/60 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto w-full text-left">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-foreground">Carregamento Rápido</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">Cache local de arquivos pesados para inicialização instantânea.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-foreground">Sem Loja de Apps</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">Não precisa baixar da Google Play ou App Store. Instalação limpa.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-foreground">Sincronização Total</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">O mesmo login e dados de tempo, em perfeita harmonia com o desktop.</p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-[10px] text-muted-foreground/60 max-w-4xl mx-auto w-full border-t border-border/40 mt-8">
        Demand Tracker &copy; {new Date().getFullYear()} — Plataforma SaaS Segura e Otimizada.
      </footer>
    </div>
  );
}
