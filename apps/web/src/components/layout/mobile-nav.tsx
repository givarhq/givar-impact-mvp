'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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

  const avatarUrl = user?.avatarUrl;
  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`.toUpperCase();

  const isSettingsActive = pathname.startsWith('/dashboard/settings');

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-14 bg-background border-t border-border/40">
      <nav className="flex items-center justify-around h-full px-2">
        {dashboardNav.map((item) => {
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
        })}

        {/* Profile Avatar on Dock - Scaled up to match vertical height of icon + label */}
        <Link
          href="/dashboard/settings"
          aria-label="Profile"
          className="flex items-center justify-center p-1 rounded-lg transition-all w-16 h-full"
        >
          <div className="relative">
            <div
              className={cn(
                "relative h-8 w-8 rounded-full overflow-hidden border transition-all flex items-center justify-center shadow-sm",
                isSettingsActive
                  ? "border-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
                  : "border-border/60 bg-muted"
              )}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-foreground">
                  {initials}
                </span>
              )}
            </div>

            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-destructive rounded-full border-2 border-background" />
            )}
          </div>
        </Link>
      </nav>
    </div>
  );
}