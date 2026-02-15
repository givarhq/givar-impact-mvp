'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, CircleUser } from 'lucide-react';
import { dashboardNav } from '../../config/dashboard';
import { cn } from '../../lib/utils/cn';

export function MobileNav({ user }: { user: any }) {
  const pathname = usePathname();

  // 1. Filter the base navigation from config
  const filteredNav = dashboardNav.filter(item => {
    // Filter out verification if not an organizer (if it exists in config)
    if (item.href === '/dashboard/verify' && user?.accountType !== 'ORGANIZER') {
      return false;
    }
    // Skip "Explore" from the config because we manually place "Donate" in the center
    if (item.href === '/dashboard/impact') {
      return false;
    }
    return true;
  });

  // 2. Construct the final flat array for perfectly even spacing
  // The goal is exactly 5 items: Home, History, Donate (Center), Proposals, Profile
  const navItems = [
    // Item 1: Home (Extracted from config)
    filteredNav[0], 
    // Item 2: History (Extracted from config)
    filteredNav[1], 
    // Item 3: Donate (Manual Center Component)
    {
      title: 'Donate',
      href: '/dashboard/impact',
      icon: Heart
    },
    // Item 4: Proposals (Extracted from config)
    filteredNav[2], 
    // Item 5: Profile (Manual Extreme Right Component)
    {
      title: 'Profile',
      href: '/dashboard/settings',
      icon: CircleUser,
    }
  ];

  const renderNavItem = (item: any) => {
    if (!item) return null;
    
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
      <nav className="flex items-center justify-around h-full px-2">
        {/* Mapping all 5 items in a single container ensures mathematical even spacing */}
        {navItems.map(renderNavItem)}
      </nav>
    </div>
  );
}
