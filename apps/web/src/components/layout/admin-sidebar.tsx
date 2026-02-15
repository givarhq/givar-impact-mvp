'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FileText, ShieldAlert,
  LogOut, Lock, BadgeCheck, Database, Building,
  BarChart3,
  Megaphone,
  Binoculars
} from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { Button } from '../ui/button';
import { deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';
import { ApiService } from '../../services/api';
import toast from 'react-hot-toast';

const navItems = [
  { title: 'Platform Overview', href: '/admin', icon: LayoutDashboard },
  { title: 'User Management', href: '/admin/users', icon: Users },
  { title: 'Cause Management', href: '/admin/projects', icon: FileText },
  { title: 'Verifications', href: '/admin/verifications', icon: BadgeCheck },
  { title: 'Organizations', href: '/admin/organizations', icon: Building },
  { title: 'Visibility Control', href: '/admin/visibility', icon: Binoculars },
  { title: 'Audit Logs', href: '/admin/audit', icon: ShieldAlert },
  { title: 'Treasury Intelligence', href: '/admin/finances', icon: BarChart3 },
  { title: 'Ledger Oversight', href: '/admin/ledger', icon: Database }
];

export function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await ApiService.auth.logout();
      deleteCookie('givar_token');
      deleteCookie('givar_user');
      router.push('/login');
      toast.success("Admin session terminated");
    } catch (error) {
      deleteCookie('givar_token');
      deleteCookie('givar_user');
      router.push('/login');
    }
  };

  return (
    <div className="sticky top-0 h-screen p-3">
      <div className="h-full flex flex-col gap-2 rounded-3xl bg-card border border-border/40 shadow-sm overflow-hidden">

        {/* Brand Area */}
        <div className="flex h-16 shrink-0 items-center px-6">
          <div className="flex items-center gap-3 font-semibold">
            <div className="relative h-9 w-9 rounded-3xl border border-destructive/20 bg-destructive/10 flex items-center justify-center text-destructive shadow-sm">
              <Lock className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg tracking-tight font-bold text-foreground leading-none">
                Givar
              </span>
              <span className="text-xs font-bold text-destructive mt-1">
                Admin panel
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-2 py-2 overflow-y-auto no-scrollbar">
          <nav className="grid items-start gap-1 text-sm font-medium">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-3xl',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <Icon className={cn("h-4.5 w-4.5 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-2 mt-auto shrink-0 border-t border-border/40">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 rounded-3xl transition-all font-bold text-xs"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}