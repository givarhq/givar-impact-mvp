'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  LogOut,
  Settings,
  ChevronDown,
  ShieldCheck,
  CircleUser,
  Zap
} from 'lucide-react';
import { ViewModeToggle } from './view-mode-toggle';
import { getCookie, deleteCookie } from 'cookies-next';
import { ApiService } from '../../services/api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils/cn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { GlobalSearch } from '../features/admin/global-search';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Platform Overview',
  '/admin/users': 'User Management',
  '/admin/projects': 'Cause Management',
  '/admin/audit': 'Audit Logs',
  '/admin/verifications': 'Evidence & Verification',
  '/admin/ledger': 'Ledger Oversight',
  '/admin/organizations': 'Organizations',
  '/admin/settings': 'System Settings'
};

export function AdminHeader({ user }: { user: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isImpersonating = getCookie('givar_is_impersonating') === 'true';
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const currentTitle = PAGE_TITLES[pathname] || 'Admin Console';
  const displayName = isClient ? `${user?.firstName} ${user?.lastName}` : 'Admin';
  const avatarUrl = user?.avatarUrl;

  const handleLogout = async () => {
    try {
      await ApiService.auth.logout();
      deleteCookie('givar_token');
      deleteCookie('givar_user');
      deleteCookie('givar_view_mode');
      deleteCookie('givar_is_impersonating');
      deleteCookie('givar_admin_backup_token');
      deleteCookie('givar_admin_backup_user');

      router.push('/login');
      toast.success("Session terminated securely");
    } catch (error) {
      deleteCookie('givar_token');
      deleteCookie('givar_user');
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 md:h-20 items-center gap-4 bg-background/80 px-4 md:px-8 backdrop-blur-xl transition-all border-b border-border/40 md:border-none">

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-center w-full">

          <div className="md:hidden flex items-center gap-3 shrink-0">
            <Link href="/admin" className="flex items-center gap-2 group">
              <div>
                <Image
                  src="/Givar1.png"
                  alt="Givar Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Givar<span className="text-primary">.</span>
              </span>
            </Link>

            <div className={cn(
              "flex items-center gap-1 border px-1.5 py-0.5 rounded-md",
              isSuperAdmin ? "bg-purple-500/10 border-purple-500/20" : "bg-destructive/10 border-destructive/20"
            )}>
              {isSuperAdmin ? <Zap className="h-3 w-3 text-purple-500" /> : <ShieldCheck className="h-3 w-3 text-destructive" />}
              <span className={cn(
                "text-[8px] uppercase font-black tracking-wider",
                isSuperAdmin ? "text-purple-600" : "text-destructive"
              )}>
                {isSuperAdmin ? 'Super' : 'Root'}
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center flex-1">
            <GlobalSearch />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {isClient && (
          <ViewModeToggle currentRole={user.role} />
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-2 rounded-full pl-1 pr-1 md:pr-3 py-1 hover:bg-secondary/50 transition-all outline-none">
              <div className={cn(
                "relative h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-full border-2 border-background shadow-sm flex items-center justify-center",
                isSuperAdmin ? "bg-purple-500/10 text-purple-600" : "bg-destructive/10 text-destructive"
              )}>
                {isClient && avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : isClient && user?.firstName ? (
                  <span className="font-bold text-sm uppercase">
                    {user.firstName[0]}
                  </span>
                ) : (
                  <CircleUser className="h-6 w-6" />
                )}
              </div>
              <div className="hidden text-left md:block pr-2">
                <span className="text-sm font-medium text-foreground leading-none block truncate max-w-[100px]">
                  {isClient && user?.firstName ? user.firstName : 'Admin'}
                </span>
              </div>
              <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 rounded-2xl p-1 shadow-2xl border-border/50 bg-card/95 backdrop-blur-xl">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-bold leading-none text-foreground">
                  {displayName}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate opacity-70">
                  {user?.email}
                </p>
                {isSuperAdmin && (
                  <span className="mt-2 inline-flex items-center text-[9px] font-black uppercase tracking-widest text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded w-fit">
                    Full Permissions
                  </span>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="rounded-xl cursor-pointer py-3 gap-3" onClick={() => router.push('/admin/settings')}>
              <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
                <Settings className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">System Settings</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-xl cursor-pointer py-3 gap-3">
              <LogOut className="h-4 w-4 ml-2.5" />
              <span className="font-bold text-xs uppercase tracking-widest">Terminate Session</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}