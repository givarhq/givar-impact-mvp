'use client';

import * as React from 'react';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';
import { AdminMobileNav } from './admin-mobile-nav';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300">
      <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]">
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block relative">
           <AdminSidebar />
        </div>
        
        {/* Content Area */}
        <div className="flex flex-col min-w-0">
          <AdminHeader />
          
          {/* Add bottom padding (pb-24) to clear mobile nav */}
          <main className="flex-1 px-4 py-4 sm:px-6 md:px-8 pb-24 md:pb-10 overflow-x-hidden">
            <div className="mx-auto w-full max-w-7xl animate-in fade-in-0 duration-300">
                {children}
            </div>
          </main>
        </div>
      </div>

      <AdminMobileNav />
    </div>
  );
}