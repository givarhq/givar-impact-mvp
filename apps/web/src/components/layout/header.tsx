'use client';

import { usePathname } from 'next/navigation';
import { dashboardNav } from '../../config/dashboard';

export function Header() {
  const pathname = usePathname();
  
  // Find current page title based on path
  const currentPage = dashboardNav.find(item => item.href === pathname)?.title || 'Dashboard';

  return (
    <header className="hidden md:flex h-16 items-center gap-4 border-b border-border bg-background/80 px-8 backdrop-blur-md sticky top-0 z-40">
      <div className="flex flex-1 items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">{currentPage}</h1>
        
        {/* Placeholder for User Avatar / Dropdown */}
        <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                G
            </div>
        </div>
      </div>
    </header>
  );
}