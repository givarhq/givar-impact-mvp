'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { deleteCookie } from 'cookies-next';
import { dashboardNav } from '../../config/dashboard';
import { cn } from '../../lib/utils/cn';
import { Button } from '../ui/button';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    deleteCookie('givar_token');
    deleteCookie('givar_user');
    router.push('/login');
  };

  return (
    <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r border-border bg-card/50 backdrop-blur-xl">
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <Link href="/dashboard">
            <span className="text-2xl font-bold tracking-tighter text-primary">Givar.</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
        <nav className="grid gap-1">
          {dashboardNav.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border/50">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}