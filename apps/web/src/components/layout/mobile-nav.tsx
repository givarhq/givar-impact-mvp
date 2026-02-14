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
    // 2. Skip "Explore" on mobile because we manually place it in the center as "Donate"
    if (item.href === '/dashboard/impact') {
      return false;
    }
    return true;
  });

  // Balance remaining 4 items around the center (2 left, 2 right)
  const midPoint = Math.ceil(filteredNav.length / 2);
  const leftItems = filteredNav.slice(0, midPoint);
  const rightItems = filteredNav.slice(midPoint);

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
        <span className="text-xs font-medium text-center">{item.title}</span>
      </Link>
    );
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-14 bg-background border-t border-border/40">
      <nav className="flex items-center justify-between h-full px-2">

        {/* Left Side: Home, History */}
        <div className="flex flex-1 justify-around">
          {leftItems.map(renderNavItem)}
        </div>

        {/* Center: Donate (Manual insertion) */}
        <div className="flex flex-1 justify-around">
          {renderNavItem({
            title: 'Donate',
            href: '/dashboard/impact',
            icon: Heart
          })}
        </div>

        {/* Right Side: Proposals, Settings */}
        <div className="flex flex-1 justify-around">
          {rightItems.map(renderNavItem)}
        </div>

      </nav>
    </div>
  );
}