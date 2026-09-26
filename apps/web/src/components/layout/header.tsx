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
  Compass,
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

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Home',
  '/dashboard/impact': 'Explore Causes',
  '/dashboard/history': 'Transaction History',
  '/dashboard/subscriptions': 'Recurring Donations',
  '/dashboard/settings': 'Settings',
};

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

      {/* Mobile Menu Dropdown Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-md md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-[56px] left-0 right-0 z-50 bg-card border-b border-border/40 shadow-2xl md:hidden overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-5">
                <Link
                  href="/dashboard/proposals/start"
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm transition-all active:scale-[0.98]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Rocket className="h-4.5 w-4.5 shrink-0" />
                  <span>Submit a cause</span>
                </Link>

                <nav className="flex flex-col gap-4 pt-1">
                  <Link
                    href="/dashboard/impact"
                    className="flex items-center gap-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Compass className="h-4 w-4 shrink-0" />
                    <span>Explore causes</span>
                  </Link>
                  <Link
                    href="/how-it-works"
                    className="flex items-center gap-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    <span>How it works</span>
                  </Link>
                  <Link
                    href="/for-companies"
                    className="flex items-center gap-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span>For companies</span>
                  </Link>
                  <Link
                    href="/about"
                    className="flex items-center gap-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Info className="h-4 w-4 shrink-0" />
                    <span>About us</span>
                  </Link>
                  <Link
                    href="/contact"
                    className="flex items-center gap-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>Contact support</span>
                  </Link>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}