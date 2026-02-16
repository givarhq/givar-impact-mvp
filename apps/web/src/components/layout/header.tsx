'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  CircleUser,
  LogOut,
  Settings,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { deleteCookie, getCookie } from 'cookies-next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ApiService } from '../../services/api';
import { useState, useEffect } from 'react';
import { ViewModeToggle } from './view-mode-toggle';
import { WalletWidget } from './wallet-widget';
import { UserGlobalSearch } from '../features/dashboard/user-global-search';
import { NotificationBell } from './notification-bell';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Home',
  '/dashboard/impact': 'Explore Causes',
  '/dashboard/history': 'Transaction History',
  '/dashboard/subscriptions': 'Recurring Donations',
  '/dashboard/settings': 'Account Settings',
};

export function Header({ user }: { user: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isImpersonating = getCookie('givar_is_impersonating') === 'true';
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'My account';
  const displayEmail = user?.email || '';
  const avatarUrl = user?.avatarUrl;

  const handleLogout = async () => {
    try {
      await ApiService.auth.logout();
      deleteCookie('givar_token');
      deleteCookie('givar_user');
      deleteCookie('givar_view_mode');
      deleteCookie('givar_is_impersonating');
      router.push('/login');
    } catch (error) {
      deleteCookie('givar_token');
      deleteCookie('givar_user');
      deleteCookie('givar_view_mode');
      deleteCookie('givar_is_impersonating');
      router.push('/login');
    }
  };

  const currentTitle = PAGE_TITLES[pathname] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between gap-4 bg-background/80 px-4 md:px-6 backdrop-blur-xl transition-all border-border/40">

      {/* 1. Left Section: Title & Mobile Brand */}
      <div className="flex items-center flex-1 min-w-0">
        <div className="flex items-center gap-4">
          <div className="md:hidden flex items-center gap-3 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <Image
                src="/Givar1.png"
                alt="Givar Logo"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
              <span className="text-lg font-bold tracking-tight text-foreground">
                Givar<span className="text-primary">.</span>
              </span>
            </Link>
          </div>

          <h1 className="hidden md:block text-lg lg:text-xl font-semibold text-foreground truncate">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* 2. Middle Section: Wide Centered Search Bar */}
      <div className="hidden md:flex flex-[3] justify-center px-8">
        <div className="w-full max-w-6xl">
          <UserGlobalSearch />
        </div>
      </div>

      {/* 3. Right Section: User Actions & Profile */}
      <div className="flex items-center justify-end flex-1 gap-2 md:gap-3 shrink-0">
        {isClient && ['ADMIN', 'SUPERADMIN'].includes(user?.role) && !isImpersonating && (
          <ViewModeToggle currentRole={user.role} />
        )}

        <div className="hidden lg:flex">
          <WalletWidget />
        </div>

        {/* Logic: Bell integrated and visible on all screen sizes */}
        {isClient && user && (
          <NotificationBell />
        )}

        <div className="hidden md:block h-6 w-px bg-border/40 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-2.5 rounded-3xl pl-1 pr-1 md:pr-3 py-1 hover:bg-muted transition-all outline-none">
              <div className="relative h-8 w-8 md:h-9 md:w-9 overflow-hidden rounded-3xl border border-border/40 shadow-sm bg-primary/5 flex items-center justify-center text-primary shrink-0">
                {isClient && avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : isClient && user?.firstName ? (
                  <span className="font-bold text-xs uppercase">
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
                <p className="text-sm font-bold text-foreground">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate opacity-70">
                  {displayEmail}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="rounded-3xl cursor-pointer py-2.5 gap-3" onClick={() => router.push('/dashboard/settings')}>
              <div className="h-8 w-8 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                <Settings className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm">Settings</span>
            </DropdownMenuItem>

            {user?.accountType === 'ORGANIZER' && (
              <DropdownMenuItem className="rounded-3xl cursor-pointer py-2.5 gap-3" onClick={() => router.push('/dashboard/settings?tab=org')}>
                <div className="h-8 w-8 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">Organization</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-3xl cursor-pointer py-2.5 gap-3">
              <LogOut className="h-4 w-4 ml-2" />
              <span className="font-semibold text-sm">Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}