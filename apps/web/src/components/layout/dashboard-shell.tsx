'use client';

import * as React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';

export function DashboardShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: any;
}) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-200">
      <div className="grid min-h-screen w-full md:grid-cols-[260px_1fr]">
        {/* Desktop Sidebar Column */}
        <div className="hidden md:block sticky top-0 h-screen overflow-hidden">
          <Sidebar user={user} />
        </div>

        {/* Main Content Column */}
        <div className="flex flex-col min-w-0">
          <Header user={user} />

          <main className="flex-1 px-4 py-4 md:px-8 md:py-6 pb-24 md:pb-8">
            <div className="mx-auto w-full max-w-6xl animate-in fade-in-0 duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>

      <MobileNav user={user} />
    </div>
  );
}