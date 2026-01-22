'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

const adminNavItems = [
  { title: 'Overview', href: '/admin', icon: LayoutDashboard },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Projects', href: '/admin/projects', icon: FileText },
  { title: 'Audit', href: '/admin/audit', icon: ShieldAlert },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-xl border-t border-border/50">
      <nav className="flex items-center justify-around h-full px-2">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all w-16 active:scale-95',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                  "relative flex h-8 w-12 items-center justify-center rounded-lg transition-all",
                  isActive && "bg-primary/10"
              )}>
                 <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium text-center">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}