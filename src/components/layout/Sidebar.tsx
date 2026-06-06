'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
  ListTodo,
  PieChart,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/demands',   label: 'Demandas',  icon: ListTodo },
  { href: '/analytics', label: 'Analytics', icon: PieChart },
  { href: '/alarms',    label: 'Alarmes',   icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-2.5 px-4 py-5 border-b border-border',
        collapsed && 'justify-center px-2'
      )}>
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-sm text-foreground whitespace-nowrap">
            Demand Tracker
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-violet-600/15 text-violet-500 dark:text-violet-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active && 'text-violet-500 dark:text-violet-400')} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition shadow-sm z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
