'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LogOut,
  Settings,
  ChevronDown,
  ShieldCheck,
  Lock
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

      <div className="flex items-center gap-3 md:gap-4">
        {/* View Toggle: Hidden during impersonation to prevent identity locks */}
        {isClient && !isImpersonating && <ViewModeToggle currentRole="ADMIN" />}

        <div className="hidden lg:flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
          System Node: Active
        </div>

        <ThemeToggle />

        <div className="h-8 w-px bg-border/50 hidden md:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 pl-2 outline-none group">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-foreground leading-none group-hover:text-primary transition-colors">
                  {displayName}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">Superuser</p>
              </div>
              <div className="relative">
                <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-tr from-destructive to-orange-500 shadow-lg shadow-destructive/20 flex items-center justify-center text-white font-black text-sm border-2 border-background group-hover:scale-105 transition-transform">
                  {isClient ? initial : 'A'}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full border border-border p-0.5">
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-[20px] p-2 shadow-2xl border-border/50 bg-card/95 backdrop-blur-xl">
            <DropdownMenuLabel className="font-normal p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none text-foreground">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground truncate opacity-70">{user?.email}</p>
              </div>
            </DropdownMenuLabel>

            <div className="px-2 pb-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-1.5 rounded-lg">
                <Lock className="h-3 w-3" />
                ROOT PRIVILEGES ACTIVE
              </div>
            </div>

            <DropdownMenuSeparator className="bg-border/50" />

            <DropdownMenuItem
              onClick={() => router.push('/admin/settings')}
              className="rounded-xl cursor-pointer py-2.5 gap-3 hover:bg-primary/5 focus:bg-primary/5"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Settings className="h-4 w-4" />
              </div>
              <span className="font-bold text-xs text-foreground">System Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border/50" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-xl cursor-pointer py-2.5 gap-3"
            >
              <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <LogOut className="h-4 w-4" />
              </div>
              <span className="font-bold text-xs uppercase tracking-widest">Terminate Session</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}