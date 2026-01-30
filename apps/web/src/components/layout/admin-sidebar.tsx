'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, ShieldAlert, LogOut, Lock, BadgeCheck, NotebookPen } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { Button } from '../ui/button';
import { deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

const navItems = [
  { title: 'Overview', href: '/admin', icon: LayoutDashboard },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Projects', href: '/admin/projects', icon: FileText },
  { title: 'Verifications', href: '/admin/verifications', icon: BadgeCheck },
  { title: 'Proposals', href: '/admin/proposals', icon: NotebookPen },
  { title: 'Audit Log', href: '/admin/audit', icon: ShieldAlert },
  { title: 'Reconcile', href: '/admin/reconcile', icon: ShieldAlert },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    deleteCookie('givar_token');
    deleteCookie('givar_user');
    router.push('/login');
  };

  return (
    <div className="sticky top-0 h-screen p-4">
      <div className="h-full flex flex-col gap-4 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/50 shadow-xl overflow-hidden">
        
        {/* Brand Area */}
        <div className="flex h-[80px] shrink-0 items-center px-6">
          <div className="flex items-center gap-3 font-semibold">
             <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-destructive/20 bg-destructive/10 flex items-center justify-center text-destructive font-bold shadow-lg shadow-destructive/5">
                <Lock className="h-4 w-4" />
             </div>
            <div className="flex flex-col">
                <span className="text-lg tracking-wide font-bold transition-colors text-foreground">
                  Givar
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-destructive">
                  Admin Panel
                </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-2 overflow-y-auto no-scrollbar">
          <nav className="grid items-start gap-2 text-sm font-medium">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-3 transition-all duration-300 rounded-xl',
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold' 
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-3 mt-auto shrink-0 border-t border-border/50">
            <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-11 rounded-xl"
                onClick={handleLogout}
            >
                <LogOut className="mr-3 h-4 w-4" /> Sign Out
            </Button>
        </div>
      </div>
    </div>
  );
}