'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleUser } from 'lucide-react';
import { dashboardNav } from '../../config/dashboard';
import { cn } from '../../lib/utils/cn';
import { ApiService } from '../../services/api';

export function MobileNav({ user }: { user: any }) {
  const pathname = usePathname();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const res = await ApiService.notifications.unreadCount();
        setHasUnread(res.count > 0);
      } catch (e) {
        setHasUnread(false);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Hybrid Navigation Logic: Unified access for all account types
  const navItems = [
    ...dashboardNav,
    {
      title: 'Profile',
      href: '/dashboard/settings?tab=profile',
      icon: CircleUser,
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-14 bg-background border-t border-border/40">
      <nav className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/dashboard'
            ? pathname === item.href
            : pathname.startsWith(item.href);

          const isProfileNode = item.title === 'Profile';

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-1 rounded-lg transition-all w-16",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5 mb-0.5", isActive && "fill-current/20")} />
                {isProfileNode && hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-destructive rounded-full border border-background" />
                )}
              </div>
              <span className="text-[10px] font-medium text-center">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}