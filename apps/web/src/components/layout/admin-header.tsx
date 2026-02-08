'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LogOut,
  Settings,
  ChevronDown,
  ShieldCheck,
  Lock,
  CircleUser
} from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
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
  const currentTitle = PAGE_TITLES[pathname] || 'Admin Console';
  const initial = user?.firstName?.[0] || 'A';
  const displayName = isClient ? `${user?.firstName} ${user?.lastName}` : 'Admin';
  const avatarUrl = user?.avatarUrl;

  const handleLogout = async () => {
    try {
      await ApiService.auth.logout();
      deleteCookie('givar_token');
      deleteCookie('givar_user');
      deleteCookie('givar_view_mode');
      deleteCookie('givar_is_impersonating');
      router.push('/login');
      toast.success("Admin session terminated");
    } catch (error) {
      deleteCookie('givar_token');
      deleteCookie('givar_user');
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 md:h-20 items-center gap-4 bg-background/80 px-4 md:px-8 backdrop-blur-xl transition-all border-b border-border/40 md:border-none">

      <div className="flex flex-col">
        <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight hidden md:block">
          {currentTitle}
        </h1>

        <div className="md:hidden flex items-center gap-2">
          <span className="font-black text-lg tracking-tighter text-foreground">GIVAR<span className="text-primary">.</span></span>
          <div className="flex items-center gap-1 bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 rounded-md">
            <ShieldCheck className="h-3 w-3 text-destructive" />
            <span className="text-[8px] uppercase text-destructive font-black tracking-wider">Root</span>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 md:gap-3">
        {isClient && !isImpersonating && <ViewModeToggle currentRole="ADMIN" />}

        <div className="hidden lg:flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
          System Node: Active
        </div>

        <ThemeToggle />

        <div className="h-8 w-px bg-border/50 hidden md:block mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-2 rounded-full pl-1 pr-1 md:pr-3 py-1 hover:bg-secondary/50 transition-all outline-none">
              <div className="relative h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-full border-2 border-background shadow-sm bg-destructive/10 flex items-center justify-center text-destructive">
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