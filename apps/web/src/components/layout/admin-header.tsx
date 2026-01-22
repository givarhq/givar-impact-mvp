'use client';

import { ThemeToggle } from './theme-toggle';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Platform Overview',
  '/admin/users': 'User Management',
  '/admin/projects': 'Project Moderation',
  '/admin/audit': 'Audit Logs',
};

export function AdminHeader() {
  const pathname = usePathname();
  const currentTitle = PAGE_TITLES[pathname] || 'Admin';

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 bg-background/80 px-8 backdrop-blur-xl transition-all border-b border-border/40 md:border-none">
      
      {/* Title */}
      <div className="flex flex-col">
        <h1 className="text-xl font-semibold text-foreground">{currentTitle}</h1>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center text-xs font-mono text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            SOTA-V2
        </div>
        
        <ThemeToggle />
        
        {/* Simple Admin Avatar */}
        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-destructive to-orange-500 shadow-lg shadow-orange-500/20 flex items-center justify-center text-white font-bold text-xs border-2 border-background">
            AD
        </div>
      </div>
    </header>
  );
}