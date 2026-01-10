'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Rocket, ArrowRight } from 'lucide-react';
import { dashboardNav } from '../../config/dashboard';
import { cn } from '../../lib/utils/cn';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 h-screen p-4">
      <div className="h-full flex flex-col gap-4 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden">
        
        {/* Brand Area */}
        <div className="flex h-[80px] shrink-0 items-center px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 font-semibold group"
          >
            <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/Givar1.png"
                alt="Givar Logo"
                width={50}
                height={50}
                className="object-contain"
                priority
              />
            </div>

            <div className="flex flex-col">
              <span className="text-xl tracking-wide font-bold transition-colors">
                <span className="text-foreground">Givar</span>
                <span className="text-primary">.</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-2 overflow-y-auto no-scrollbar">
          <nav className="grid items-start gap-2 text-sm font-medium">
            {dashboardNav.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-xl',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors',
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

        {/* Start a Cause */}
        <div className="p-3 mt-auto shrink-0">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-4 transition-all hover:shadow-lg hover:shadow-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Rocket className="h-3 w-3" />
              </div>
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                Start a Cause
              </span>
            </div>

            <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
              Raise funds for your community with transparent tracking.
            </p>

            <button className="flex items-center text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors bg-background/50 px-2 py-1 rounded-md w-full justify-center shadow-sm">
              Launch Now <ArrowRight className="ml-1 h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
