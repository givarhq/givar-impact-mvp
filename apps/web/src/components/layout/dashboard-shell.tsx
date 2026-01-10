'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Heart, History, Settings, LogOut, Menu } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { Button } from '../../components/ui/button';
import { deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Impact', href: '/dashboard/impact', icon: Heart },
  { name: 'History', href: '/dashboard/history', icon: History },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    deleteCookie('givar_token');
    deleteCookie('givar_user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden w-64 border-r border-border bg-card/50 flex-col md:flex fixed h-full z-30">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="text-2xl font-bold tracking-tighter text-primary">Givar.</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border">
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

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden h-16 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-md sticky top-0 z-40">
           <span className="text-xl font-bold text-primary">Givar.</span>
           <Button variant="ghost" size="icon">
             <Menu className="w-5 h-5" />
           </Button>
        </header>

        <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in-0 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}