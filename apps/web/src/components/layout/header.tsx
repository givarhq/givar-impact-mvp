'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  CircleUser,
  LogOut,
  Settings,
  ChevronDown,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { deleteCookie, getCookie } from 'cookies-next';
import toast from 'react-hot-toast';
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

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'My Account';
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
    <header className="sticky top-0 z-30 flex h-16 md:h-20 items-center gap-4 bg-background/80 px-4 md:px-6 backdrop-blur-xl transition-all border-b border-border/40 md:border-none">

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-6 w-full">
          {/* Mobile Brand */}
          <div className="md:hidden flex items-center gap-3 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2 group">
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
          </div>

          {/* Desktop: Title and Global Search */}
          <div className="hidden md:flex items-center gap-10 flex-1">
            <h1 className="text-xl font-semibold text-foreground shrink-0 hidden lg:block">
              {currentTitle}
            </h1>
            <UserGlobalSearch />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {isClient && ['ADMIN', 'SUPERADMIN'].includes(user?.role) && !isImpersonating && (
          <ViewModeToggle currentRole={user.role} />
        )}

        <div className="hidden lg:flex">
          <WalletWidget />
        </div>

        <div className="h-8 w-px bg-border/50 mx-1 hidden md:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-2 rounded-full pl-1 pr-1 md:pr-3 py-1 hover:bg-secondary/50 transition-all outline-none">
              <div className="relative h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-full border-2 border-background shadow-sm bg-primary/10 flex items-center justify-center text-primary">
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
                  {isClient && user?.firstName ? user.firstName : 'Account'}
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
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {displayEmail}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="rounded-xl cursor-pointer py-3 gap-3" onClick={() => router.push('/dashboard/settings')}>
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-muted-foreground">
                <Settings className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Profile & Settings</span>
              </div>
            </DropdownMenuItem>

            {user?.accountType === 'ORGANIZER' && (
              <DropdownMenuItem className="rounded-xl cursor-pointer py-3 gap-3" onClick={() => router.push('/dashboard/settings?tab=org')}>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-muted-foreground">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Verification Status</span>
                </div>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-xl cursor-pointer py-3 gap-3">
              <LogOut className="h-4 w-4 ml-2.5" />
              <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}