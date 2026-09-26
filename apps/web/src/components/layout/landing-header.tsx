'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui/button';
import { useEffect, useState, memo, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils/cn';
import { LandingHeaderProps } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicGlobalSearch } from '../features/impact/public-global-search';

const NAV_ITEMS = [
  { title: 'Explore Causes', href: '/explore' },
  { title: 'How It Works', href: '/how-it-works' },
  { title: 'About', href: '/about' },
  { title: 'For Companies', href: '/for-companies' },
];

export const LandingHeader = memo(function LandingHeader({
  hideAuthButtons = false,
  variant = 'default',
}: LandingHeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAuth = variant === 'auth';
  const isApp = variant === 'app';

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const isRouteActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header
        className={cn(
          isApp
            ? 'sticky top-0 z-30 h-14 md:h-16 flex items-center bg-background/80 backdrop-blur-xl border-b border-border/40 md:border-none md:shadow-none transition-all'
            : cn(
              'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
              isAuth || isMenuOpen
                ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl py-4 shadow-sm'
                : scrolled
                  ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-border/40 py-3 shadow-sm'
                  : 'bg-transparent py-5'
            )
        )}
      >
        <div className={cn("container mx-auto px-4 md:px-6 relative flex items-center justify-between", isApp && "max-w-none px-4 md:px-6")}>
          <div className={cn(isApp ? "md:hidden" : "flex", "items-center flex-1 min-w-0")}>
            <Link href="/" className="flex items-center gap-2 group relative z-10 outline-none" onClick={() => setIsMenuOpen(false)}>
              <div>
                <Image
                  src="/Givar1.png"
                  alt="Givar Logo"
                  width={30}
                  height={30}
                  className="object-contain transition-transform group-hover:scale-105"
                  priority
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Givar<span className="text-primary">.</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {isApp ? (
            <div className="hidden md:flex flex-[3] justify-center px-8">
              <div className="w-full max-w-6xl flex justify-center">
                <PublicGlobalSearch />
              </div>
            </div>
          ) : (
            <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8 text-sm font-semibold">
              {NAV_ITEMS.map((item) => {
                const active = isRouteActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "transition-colors py-1 relative",
                      active ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.title}
                    {active && (
                      <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-primary rounded-full animate-in fade-in duration-200" />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className={cn("relative z-10 flex items-center justify-end gap-3 shrink-0", isApp && "flex-1")}>
            {!hideAuthButtons && (
              <>
                <Link href="/login" className="hidden md:flex items-center justify-center">
                  <span className="text-sm font-semibold text-foreground hover:text-primary px-3 py-2 transition-colors cursor-pointer">
                    Sign in
                  </span>
                </Link>
                <Link href="/signup" className="flex items-center justify-center">
                  <Button className="h-10 px-6 rounded-full bg-primary hover:bg-primary/90 transition-all active:scale-95 text-white font-bold border-0 text-sm shadow-sm">
                    Get started
                  </Button>
                </Link>
              </>
            )}

            <button
              className="md:hidden p-1.5 text-foreground flex items-center justify-center outline-none active:scale-95 transition-transform"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed inset-0 top-[56px] z-50 bg-background/95 dark:bg-background/98 backdrop-blur-2xl flex flex-col justify-between px-6 py-8 md:hidden overflow-y-auto"
          >
            <div className="flex flex-col w-full divide-y divide-border/40">
              {NAV_ITEMS.map((item) => {
                const active = isRouteActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "py-5 text-xl font-medium transition-colors flex items-center justify-between",
                      active ? "text-primary font-semibold" : "text-foreground hover:text-primary"
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>{item.title}</span>
                    {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </div>

            {!hideAuthButtons && (
              <div className="pt-8 pb-6 flex flex-col gap-3 w-full border-t border-border/40 mt-auto">
                <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="w-full">
                  <Button className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/20 border-0">
                    Get started
                  </Button>
                </Link>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="w-full">
                  <Button variant="outline" className="w-full h-12 rounded-full font-bold text-base border-border/60 hover:bg-muted">
                    Sign in
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});