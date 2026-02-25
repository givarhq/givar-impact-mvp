'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, CircleUser, NotebookPen, Compass } from 'lucide-react';
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

  // 1. Manually construct the nav to ensure perfect order and spacing on mobile
  const navItems = [
    {
      title: 'Home',
      href: '/dashboard',
      icon: Compass,
    },
    {
      title: 'Explore',
      href: '/dashboard/impact',
      icon: Heart,
    },
    {
      title: 'Proposals',
      href: '/dashboard/proposals',
      icon: NotebookPen,
      isCenter: true
    },
    {
      title: 'History',
      href: '/dashboard/history',
      icon: dashboardNav[2].icon,
    },
    {
      title: 'Profile',
      href: '/dashboard/settings',
      icon: CircleUser,
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-md border-t border-border/40 pb-2">
      <nav className="flex items-center justify-between h-full px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/dashboard'
            ? pathname === item.href
            : pathname.startsWith(item.href);

          const isProfileNode = item.title === 'Profile';

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-5"
              >
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center shadow-lg border-2 transition-all active:scale-95",
                  isActive ? "bg-primary border-primary text-white ring-4 ring-primary/10" : "bg-foreground text-background border-foreground"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-1 rounded-xl transition-all w-14",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5 mb-1", isActive && "fill-current/20")} />
                {isProfileNode && hasUnread && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-destructive rounded-full border border-background animate-pulse" />
                )}
              </div>
              <span className="text-[10px] font-bold text-center leading-none">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}