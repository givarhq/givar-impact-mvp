import * as React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* 1. Desktop Sidebar */}
      <Sidebar />

      {/* 2. Main Layout Column */}
      <div className="flex flex-col md:ml-64 min-h-screen">
        
        {/* 3. Desktop Header */}
        <Header />

        {/* 4. Page Content */}
        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8 max-w-7xl mx-auto w-full animate-in fade-in-0 duration-300">
            {children}
        </main>
      </div>

      {/* 5. Mobile Bottom Dock */}
      <MobileNav />
    </div>
  );
}