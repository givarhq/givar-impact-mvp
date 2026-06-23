'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FileText, ShieldAlert,
  LogOut, Lock, BadgeCheck, Database, Building,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { ApiService } from '../../services/api';
import toast from 'react-hot-toast';
import { usePostHog } from 'posthog-js/react';

const navItems = [
  { title: 'Platform Overview', href: '/admin', icon: LayoutDashboard },
  { title: 'User Management', href: '/admin/users', icon: Users },
  { title: 'Cause Management', href: '/admin/projects', icon: FileText },
  { title: 'Verifications', href: '/admin/verifications', icon: BadgeCheck },
  { title: 'Organizers', href: '/admin/organizations', icon: Building },
  { title: 'Financial Analytics', href: '/admin/finances', icon: BarChart3 },
  { title: 'Ledger Oversight', href: '/admin/ledger', icon: Database },
  { title: 'Audit Logs', href: '/admin/audit', icon: ShieldAlert },
];

export function AdminSidebar({ user }: { user: any }) {
  const posthog = usePostHog();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      posthog?.capture('user_logout', { context: 'admin_sidebar' });
      posthog?.reset();
      await ApiService.auth.logout();
      toast.success("Admin session terminated");
    } catch (error) {
      // Silently fail if network is down
    } finally {
      // Logic: Rely on Next.js server route to securely destroy HttpOnly cookies
      window.location.href = '/api/auth/clear-session?reason=logged_out';
    }
  };

  return (
    <div className="sticky top-0 h-screen p-3">
      <div className="h-full flex flex-col gap-2 rounded-3xl bg-card border border-border/40 shadow-sm overflow-hidden">

        {/* Brand Area */}
        <div className="flex h-16 shrink-0 items-center px-5">
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

        {/* Navigation - Removed px-2 to allow edge-to-edge full width */}
        <div className="flex-1 py-2 overflow-y-auto no-scrollbar">
          <nav className="grid items-start gap-1 text-sm font-medium w-full">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 px-5 py-2.5 transition-all duration-200 w-full',
                    isActive
                      ? 'border-l-[3px] border-primary bg-primary/5 text-primary font-bold'
                      : 'border-l-[3px] border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4.5 w-4.5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
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