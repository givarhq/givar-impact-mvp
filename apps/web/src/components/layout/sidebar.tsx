'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Rocket, ArrowRight } from 'lucide-react';
import { dashboardNav } from '../../config/dashboard';
import { cn } from '../../lib/utils/cn';

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();

  // Logic: All users have access to the full dashboard suite in the hybrid model.
  // Verification gates are handled at the page/action level rather than hiding nav items.
  const navItems = dashboardNav;

  return (
    <div className="sticky top-0 h-screen w-full p-3 hidden md:block">
      <div className="h-full flex flex-col gap-2 rounded-3xl bg-card border border-border/40 shadow-sm overflow-hidden">
        {/* Brand Area */}
        <div className="flex h-16 shrink-0 items-center px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-semibold group"
          >
            <div className="relative h-8 w-8 overflow-hidden rounded-3xl border border-border bg-background flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/Givar1.png"
                alt="Givar Logo"
                width={24}
                height={24}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg tracking-tight font-bold text-foreground">
              Givar<span className="text-primary">.</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-2 py-2 overflow-y-auto no-scrollbar">
          <nav className="grid items-start gap-1 text-sm font-medium">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = item.href === '/dashboard'
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-3xl',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4.5 w-4.5 transition-colors',
                      isActive
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Card: Start a Cause */}
        <div className="p-2 mt-auto shrink-0 border-t border-border/40">
          <Link href="/dashboard/proposals/start" className="block group">
            <div className="relative overflow-hidden rounded-3xl bg-muted/30 border border-border/50 p-4 transition-all hover:bg-muted/50">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-3xl bg-primary/20 text-primary">
                    <Rocket className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    Start a cause
                  </span>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Launch your verified impact project.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}