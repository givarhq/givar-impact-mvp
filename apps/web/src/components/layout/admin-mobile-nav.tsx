'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BadgeCheck, FileText, Database } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

// Filtered items for the mobile dock (Top 4 critical ops)
const adminMobileItems = [
  { title: 'Overview', href: '/admin', icon: LayoutDashboard },
  { title: 'Verify', href: '/admin/verifications', icon: BadgeCheck },
  { title: 'Projects', href: '/admin/projects', icon: FileText },
  { title: 'Ledger', href: '/admin/ledger', icon: Database },
];

export function AdminMobileNav({ user }: { user: any }) {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-xl border-t border-border/50">
      <nav className="flex items-center justify-around h-full px-2">
        {adminMobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all w-20 active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                "relative flex h-8 w-12 items-center justify-center rounded-lg transition-all duration-300",
                isActive && "bg-primary/10 shadow-inner"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold tracking-tight text-center">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}