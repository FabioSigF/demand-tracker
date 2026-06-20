'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, ChevronDown, Menu } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { GlobalSearch } from '@/components/demands/GlobalSearch';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user, signOutUser } = useAuthContext();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push('/login');
      toast.success('Sessão encerrada');
    } catch {
      toast.error('Erro ao sair');
    }
  };

  const initials = user ? getInitials(user.email ?? '', user.displayName ?? undefined) : 'U';

  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent md:hidden transition"
          title="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm sm:text-base font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <GlobalSearch />
        <ThemeToggle />

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-accent rounded-lg px-2 py-1.5 transition"
          >
            <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <span className="text-sm text-foreground hidden sm:block max-w-[120px] truncate">
              {user?.displayName || user?.email}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
