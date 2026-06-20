'use client';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const options = [
    { value: 'light', icon: Sun },
    { value: 'system', icon: Monitor },
    { value: 'dark', icon: Moon },
  ] as const;

  return (
    <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 min-h-[30px]">
      {options.map(({ value, icon: Icon }) => {
        const isActive = mounted && theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'p-1.5 rounded-md transition-all',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title={value === 'light' ? 'Claro' : value === 'dark' ? 'Escuro' : 'Sistema'}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}
