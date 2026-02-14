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
  '/admin/verifications': 'Verifications',
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
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center gap-4 bg-background/80 px-4 md:px-6 backdrop-blur-xl transition-all border-border/40 md:border-none">
      <div className="flex items-center justify-between w-full gap-4">

        {/* Left Section: Title (Desktop) and Brand (Mobile) */}
        <div className="flex items-center min-w-0">
          <h1 className="text-lg md:text-xl font-semibold text-foreground hidden md:block truncate">
            {currentTitle}
          </h1>

          <div className="md:hidden flex items-center gap-2 shrink-0">
            <Link href="/admin" className="flex items-center gap-2 group">
              <div className="shrink-0">
                <Image
                  src="/Givar1.png"
                  alt="Givar Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                Givar<span className="text-primary">.</span>
              </span>
            </Link>

            <div className={cn(
              "flex items-center gap-1 border px-2 py-0.5 rounded-3xl shrink-0",
              isSuperAdmin ? "bg-purple-500/10 border-purple-500/20" : "bg-destructive/10 border-destructive/20"
            )}>
              {isSuperAdmin ? <Zap className="h-3 w-3 text-purple-500" /> : <ShieldCheck className="h-3 w-3 text-destructive" />}
              <span className={cn(
                "text-xs font-semibold tracking-tight",
                isSuperAdmin ? "text-purple-600" : "text-destructive"
              )}>
                {isSuperAdmin ? 'Super' : 'Root'}
              </span>
            </div>
          </div>
        </div>

        {/* Center Section: Search Bar (Desktop Only) */}
        <div className="hidden lg:flex items-center justify-center flex-1 max-w-lg">
          <GlobalSearch />
        </div>

        {/* Right Section: Actions and Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {isClient && (
            <ViewModeToggle currentRole={user.role} />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="group flex items-center gap-2 rounded-3xl p-1 hover:bg-muted transition-all outline-none">
                <div className={cn(
                  "relative h-8 w-8 md:h-9 md:w-9 overflow-hidden rounded-3xl border border-border/40 shadow-sm flex items-center justify-center shrink-0",
                  isSuperAdmin ? "bg-purple-500/10 text-purple-600" : "bg-primary/5 text-primary"
                )}>
                  {isClient && avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : isClient && user?.firstName ? (
                    <span className="font-semibold text-xs uppercase">
                      {user.firstName[0]}
                    </span>
                  ) : (
                    <CircleUser className="h-5 w-5" />
                  )}
                </div>
                <ChevronDown className="hidden md:block h-3.5 w-3.5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60 rounded-3xl p-1 shadow-xl border-border/40 bg-card/95 backdrop-blur-xl">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-0.5 p-2">
                  <p className="text-sm font-semibold text-foreground">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate opacity-70">
                    {user?.email}
                  </p>
                  {isSuperAdmin && (
                    <span className="mt-1.5 inline-flex items-center text-xs font-semibold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-3xl w-fit">
                      Full Permissions
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="rounded-3xl cursor-pointer py-2.5 gap-3" onClick={() => router.push('/admin/settings')}>
                <div className="h-8 w-8 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive">
                  <Settings className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-3xl cursor-pointer py-2.5 gap-3">
                <LogOut className="h-4 w-4 ml-2" />
                <span className="font-semibold text-sm">Terminate Session</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}