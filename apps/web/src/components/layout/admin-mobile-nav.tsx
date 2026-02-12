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
  MoreHorizontal
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
  { title: 'Orgs', href: '/admin/organizations', icon: Building },
  { title: 'Ledger', href: '/admin/ledger', icon: Database },
  { title: 'Audit', href: '/admin/audit', icon: ShieldAlert },
];

export function AdminMobileNav({ user }: { user: any }) {
  const pathname = usePathname();

  const primaryItems = ALL_NAV_ITEMS.slice(0, 4);
  const secondaryItems = ALL_NAV_ITEMS.slice(4);

  const isSecondaryActive = secondaryItems.some(item => pathname.startsWith(item.href));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur-xl border-t border-border/40">
      <nav className="flex items-center justify-around h-full px-2">

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
                "flex flex-col items-center justify-center p-1 rounded-3xl transition-all w-16",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-0.5", isActive && "fill-current/10")} />
              <span className="text-xs font-bold text-center leading-none">{item.title}</span>
            </Link>
          );
        })}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center p-1 rounded-3xl transition-all w-16 outline-none active:scale-95",
                isSecondaryActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className={cn("h-5 w-5 mb-0.5", isSecondaryActive && "fill-current/10")} />
              <span className="text-xs font-bold text-center leading-none">More</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="end"
            sideOffset={15}
            className="w-56 rounded-3xl p-1 shadow-2xl border-border/40 bg-card/95 backdrop-blur-xl mb-2"
          >
            <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              System tools
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-border/40" />

            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-3xl cursor-pointer transition-colors font-bold text-xs",
                      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
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