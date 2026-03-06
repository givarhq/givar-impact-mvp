'use client';

import * as React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';
import { Footer } from './footer';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export function DashboardShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: any;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-200">
      <div className="grid min-h-screen w-full md:grid-cols-[260px_1fr]">
        <div className="hidden md:block sticky top-0 h-screen overflow-hidden">
          <Sidebar user={user} />
        </div>

        <div className="flex flex-col min-w-0">
          <Header user={user} />

          <main className="flex-1 px-4 py-4 md:px-8 md:py-6 pb-24 md:pb-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{
                  duration: 0.2,
                  ease: [0.23, 1, 0.32, 1] // Quintic easing for snappy feel
                }}
                className="mx-auto w-full max-w-6xl"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          <div className="hidden md:block">
            <Footer />
          </div>
        </div>
      </div>

      <MobileNav user={user} />
    </div>
  );
}