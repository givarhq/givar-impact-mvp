'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  BadgeCheck,
  Database,
  ShieldAlert,
  Building,
  MoreHorizontal,
  BarChart3,
  Binoculars
} from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';

const ALL_NAV_ITEMS = [
  { title: 'Overview', href: '/admin', icon: LayoutDashboard },
  { title: 'Projects', href: '/admin/projects', icon: FileText },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Verify', href: '/admin/verifications', icon: BadgeCheck },
  // Overflow items
  { title: 'Organizations', href: '/admin/organizations', icon: Building },
  { title: 'Ledger', href: '/admin/ledger', icon: Database },
  { title: 'Audit', href: '/admin/audit', icon: ShieldAlert },
  { title: 'Treasury', href: '/admin/finances', icon: BarChart3 },
  { title: 'Visiblity', href: '/admin/visibility', icon: Binoculars },
];

export function AdminMobileNav({ user }: { user: any }) {
  const pathname = usePathname();

  // Split: First 4 are direct, rest go into "More"
  const primaryItems = ALL_NAV_ITEMS.slice(0, 4);
  const secondaryItems = ALL_NAV_ITEMS.slice(4);

  const isSecondaryActive = secondaryItems.some(item => pathname.startsWith(item.href));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-14 bg-background border-t border-border/40">
      <nav className="flex items-center justify-around h-full px-2">

        {/* 1. Primary Items (Direct Access) */}
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
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

        {/* 2. The "More" Menu (Overflow) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center p-1 rounded-lg transition-all w-16 outline-none active:scale-95",
                isSecondaryActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className={cn("h-5 w-5 mb-0.5", isSecondaryActive && "fill-current/20")} />
              <span className="text-[10px] font-medium text-center">More</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="end"
            sideOffset={15}
            className="w-56 rounded-2xl p-2 shadow-2xl border-border/50 bg-card/95 backdrop-blur-xl mb-1"
          >
            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              System Tools
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-border/50" />

            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors font-bold text-xs",
                      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                    {item.title}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

      </nav>
    </div>
  );
}