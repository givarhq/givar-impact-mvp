'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dashboardNav } from '../../config/dashboard';
import { cn } from '../../lib/utils/cn';

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      {/* Glassmorphism Dock */}
      <nav className="flex items-center justify-around border-t border-border bg-background/80 backdrop-blur-lg px-2 pb-5 pt-3 shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
        {dashboardNav.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={index}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-1 transition-all duration-200 active:scale-95',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                  "relative flex h-9 w-12 items-center justify-center rounded-2xl transition-all",
                  isActive && "bg-primary/10"
              )}>
                 <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}