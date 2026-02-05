'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart } from 'lucide-react';
import { dashboardNav } from '../../config/dashboard';
import { cn } from '../../lib/utils/cn';

export function MobileNav({ user }: { user: any }) {
  const pathname = usePathname();

  const filteredNav = dashboardNav.filter(item => {
    // 1. Filter out verification if not an organizer
    if (item.href === '/dashboard/verify' && user?.accountType !== 'ORGANIZER') {
      return false;
    }
    // 2. Skip "Explore" on mobile because the central Heart FAB performs that action
    if (item.href === '/dashboard/impact') {
      return false;
    }
    return true;
  });

  // Balance remaining items around the FAB (2 left, 2 right)
  const midPoint = Math.ceil(filteredNav.length / 2);
  const leftItems = filteredNav.slice(0, midPoint);
  const rightItems = filteredNav.slice(midPoint);

  const handleOpenDonate = () => {
    window.location.href = '/dashboard/impact';
  };

  const renderNavItem = (item: any) => {
    const Icon = item.icon;
    const isActive = item.href === '/dashboard'
      ? pathname === item.href
      : pathname.startsWith(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex flex-col items-center justify-center p-1 rounded-lg transition-all w-16",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className={cn("h-5 w-5 mb-0.5", isActive && "fill-current/20")} />
        <span className="text-[10px] font-medium text-center">{item.title}</span>
      </Link>
    );
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur-xl border-t border-border/40">

      {/* The Glow Effect Container */}
      <div className="absolute -top-px left-0 w-full h-8 pointer-events-none [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <svg
          className="absolute top-0 left-0 w-full h-auto [filter:drop-shadow(0_-1px_3px_hsl(var(--primary)/0.9))]"
          viewBox="0 0 320 18"
          fill="none"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M 0 10 A 10 10 0 0 1 10 0 H 125 C 130 0, 135 4, 140 10 L 145 15 C 150 20, 170 20, 175 15 L 180 10 C 185 4, 190 0, 195 0 H 310 A 10 10 0 0 1 320 10"
            className="stroke-primary"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      <nav className="flex items-center justify-between h-full px-2">

        {/* Left Group (Overview, History) */}
        <div className="flex flex-1 justify-around">
          {leftItems.map(renderNavItem)}
        </div>

        {/* Center Floating Action Button (Explore/Donate) */}
        <div className="relative -top-4 shrink-0">
          <button
            onClick={handleOpenDonate}
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-background transition-transform active:scale-95"
            aria-label="Explore Causes"
          >
            <Heart className="h-6 w-6 text-white fill-white" />
          </button>
        </div>

        {/* Right Group (Subscriptions, Proposals) */}
        <div className="flex flex-1 justify-around">
          {rightItems.map(renderNavItem)}
        </div>

      </nav>
    </div>
  );
}