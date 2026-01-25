'use client';

import * as React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300">
      
      <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]">
        
        {/* Desktop Sidebar Column - FIXED/STICKY POSITIONING */}
        <div className="hidden md:block sticky top-0 h-screen overflow-hidden">
           <Sidebar />
        </div>
        
        {/* Main Content Column */}
        <div className="flex flex-col min-w-0">
          <Header />
          
          <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 pb-28 md:pb-8">
            <div className="mx-auto w-full max-w-7xl animate-in fade-in-0 duration-300">
                {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Dock */}
      <MobileNav />
    </div>
  );
}