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
  Menu,
  X,
  HelpCircle,
  Building2,
  Info,
  Mail,
  Rocket
} from 'lucide-react';
import { getCookie } from 'cookies-next';
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
import { UserGlobalSearch } from '../features/dashboard/user-global-search';
import { NotificationBell } from './notification-bell';
import { Skeleton } from '../ui/skeleton';
import { usePostHog } from 'posthog-js/react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils/cn';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Home',
  '/dashboard/impact': 'Explore Causes',
  '/dashboard/history': 'Transaction History',
  '/dashboard/subscriptions': 'Recurring Donations',
  '/dashboard/settings': 'Settings',
};

const DASHBOARD_MENU_LINKS = [
  { title: 'How it works', href: '/how-it-works', icon: HelpCircle },
  { title: 'For companies', href: '/for-companies', icon: Building2 },
  { title: 'About us', href: '/about', icon: Info },
  { title: 'Contact support', href: '/contact', icon: Mail },
];

export function Header({ user }: { user: any }) {
  const posthog = usePostHog();
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const isImpersonating = getCookie('givar_is_impersonating') === 'true';
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'My account';
  const displayEmail = user?.email || '';
  const avatarUrl = user?.avatarUrl;

  const handleLogout = async () => {
    try {
      posthog?.capture('user_logout');
      posthog?.reset();
      await ApiService.auth.logout();
    } catch (error) {
      // Silently fail if network is down
    } finally {
      window.location.href = '/api/auth/clear-session?reason=logged_out';
    }
  };

  const currentTitle = PAGE_TITLES[pathname] || 'Dashboard';

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between gap-4 bg-background/80 px-4 md:px-6 backdrop-blur-xl transition-all border-b md:border-b-0 border-border/40">

        <div className="flex items-center flex-1 min-w-0">
          <div className="flex items-center gap-4">
            <div className="md:hidden flex items-center gap-3 shrink-0">
              <Link href="/dashboard" className="flex items-center gap-2 group" onClick={() => setIsMobileMenuOpen(false)}>
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

            <h1 className="hidden md:block text-lg font-semibold text-foreground truncate">
              {currentTitle}
            </h1>
          </div>
        </div>

        <div className="hidden md:flex flex-[3] justify-center px-8">
          <div className="w-full max-w-6xl">
            <UserGlobalSearch />
          </div>
        </div>

        <div className="flex items-center justify-end flex-1 gap-2 md:gap-3 shrink-0">
          {!isClient ? (
            <Skeleton className="hidden lg:flex h-8 w-24 rounded-3xl" />
          ) : (
            ['ADMIN', 'SUPERADMIN'].includes(user?.role) && !isImpersonating && (
              <ViewModeToggle currentRole={user.role} />
            )
          )}

          {!isClient ? (
            <Skeleton className="h-9 w-9 rounded-xl" />
          ) : (
            user && <NotificationBell />
          )}

          <div className="hidden md:block h-6 w-px bg-border/40 mx-1" />

          {/* Desktop Only Profile Dropdown */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex items-center gap-2.5 rounded-3xl pl-1 pr-1 md:pr-3 py-1 hover:bg-muted transition-all outline-none">
                  <div className="relative h-8 w-8 md:h-9 md:w-9 overflow-hidden rounded-3xl border border-border/40 shadow-sm bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    {!isClient ? (
                      <Skeleton className="h-full w-full" />
                    ) : avatarUrl ? (
                      <Image src={avatarUrl} alt="" fill className="object-cover" sizes="36px" />
                    ) : user?.firstName ? (
                      <span className="font-bold text-xs ">
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

                <DropdownMenuItem className="rounded-3xl cursor-pointer py-2.5 gap-3" onClick={() => router.push('/dashboard/settings?tab=verification')}>
                  <div className="h-8 w-8 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-sm">Verification</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-3xl cursor-pointer py-2.5 gap-3">
                  <LogOut className="h-4 w-4 ml-2" />
                  <span className="font-semibold text-sm">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Only Hamburger Menu Button */}
          <button
            className="md:hidden p-1.5 text-foreground flex items-center justify-center outline-none active:scale-95 transition-transform"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Full-Screen Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 top-[56px] z-50 bg-background/95 dark:bg-background/98 backdrop-blur-2xl flex flex-col justify-between px-6 py-8 md:hidden overflow-y-auto"
          >
            <div className="flex flex-col w-full space-y-6">
              {/* Fully Rounded "Submit a cause" Pill Button */}
              <Link
                href="/dashboard/proposals/start"
                className="flex items-center gap-3 px-5 py-3.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-sm transition-all active:scale-[0.98]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Rocket className="h-4.5 w-4.5 shrink-0" />
                <span>Submit a cause</span>
              </Link>

              <div className="flex flex-col w-full divide-y divide-border/40">
                {DASHBOARD_MENU_LINKS.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "py-5 text-xl font-semibold transition-colors flex items-center justify-between",
                        isActive ? "text-primary" : "text-foreground hover:text-primary"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <span>{item.title}</span>
                      </div>
                      {isActive && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-border/40 mt-auto flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Givar Protocol</span>
              <span>Verified Philanthropy</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}