'use client';

import * as React from 'react';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';
import { AdminMobileNav } from './admin-mobile-nav';
import { Footer } from './footer';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface AdminShellProps {
  children: React.ReactNode;
  user: any;
}

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-200 selection:bg-destructive/10">
      <div className="grid min-h-screen w-full md:grid-cols-[260px_1fr]">
        <div className="hidden md:block relative sticky top-0 h-screen overflow-hidden">
          <AdminSidebar user={user} />
        </div>

        <div className="flex flex-col min-w-0">
          <AdminHeader user={user} />

          <main className="flex-1 px-4 py-4 md:px-8 md:py-6 pb-24 md:pb-10 overflow-x-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{
                  duration: 0.15,
                  ease: "circOut" // Ultra-fast circular easing
                }}
                className="mx-auto w-full max-w-7xl"
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

      <AdminMobileNav user={user} />
    </div>
  );
}