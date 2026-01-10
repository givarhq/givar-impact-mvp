'use client';

import * as React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300">
      
      {/* 
        SOTA Grid Layout 
        - Mobile: 1 Column
        - Desktop: [280px Sidebar] [Rest Content]
      */}
      <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]">
        
        {/* Desktop Sidebar Column */}
        <div className="hidden md:block relative">
           {/* Sidebar Component handles its own sticky positioning */}
           <Sidebar />
        </div>
        
        {/* Main Content Column */}
        <div className="flex flex-col min-w-0">
          <Header />
          
          <main className="flex-1 px-4 py-4 sm:px-6 md:px-8 pb-24 md:pb-8 overflow-x-hidden">
            <div className="mx-auto w-full max-w-7xl animate-in fade-in-0 duration-300">
                {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Dock (Fixed overlay) */}
      <MobileNav />
    </div>
  );
}