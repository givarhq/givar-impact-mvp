'use client';

import React, { useState, useEffect } from 'react';
import { ThemeToggle } from './theme-toggle';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils/cn';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Platform Overview',
  '/admin/users': 'User Management',
  '/admin/projects': 'Cause Management',
  '/admin/audit': 'Audit Logs',
  '/admin/verifications': 'Evidence & Verification',
  '/admin/ledger': 'Ledger Oversight',
  '/admin/organizations': 'Organizations'
};

export function AdminHeader({ user }: { user: any }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const currentTitle = PAGE_TITLES[pathname] || 'Admin Console';
  const initial = user?.firstName?.[0] || 'A';

  return (
    <header className="sticky top-0 z-30 flex h-16 md:h-20 items-center gap-4 bg-background/80 px-4 md:px-8 backdrop-blur-xl transition-all border-b border-border/40 md:border-none">

      {/* Brand/Title Section */}
      <div className="flex flex-col">
        <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight hidden md:block">
          {currentTitle}
        </h1>

        {/* Mobile Logo Fallback */}
        <div className="md:hidden flex items-center gap-2">
          <span className="font-black text-lg tracking-tighter">GIVAR<span className="text-destructive">.</span></span>
          <Badge variant="outline" className="text-[8px] h-4 px-1 uppercase border-destructive/30 text-destructive font-black">Admin</Badge>
        </div>
      </div>

      <div className="flex-1" />

      {/* Action Tray */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden lg:flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
          System Node: Active
        </div>

        <ThemeToggle />

        {/* Admin Identity Disk */}
        <div className="flex items-center gap-3 pl-2 border-l border-border/50">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-foreground leading-none">
              {isClient ? user?.firstName : 'Admin'}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium mt-1">Superuser</p>
          </div>
          <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-tr from-destructive to-orange-500 shadow-lg shadow-destructive/20 flex items-center justify-center text-white font-black text-sm border-2 border-background animate-in zoom-in duration-500">
            {isClient ? initial : 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}

// Minimal Badge for the Header logo
function Badge({ children, className, variant }: any) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)}>
      {children}
    </span>
  );
}