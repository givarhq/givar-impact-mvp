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
            <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8 text-sm font-semibold text-muted-foreground">
              <Link
                href="/explore"
                className={cn(
                  "hover:text-foreground transition-colors py-1 relative",
                  pathname.startsWith('/explore') && "text-foreground font-bold"
                )}
              >
                Explore Causes
                {pathname.startsWith('/explore') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
              <Link
                href="/how-it-works"
                className={cn(
                  "hover:text-foreground transition-colors py-1 relative",
                  pathname.startsWith('/how-it-works') && "text-foreground font-bold"
                )}
              >
                How It Works
                {pathname.startsWith('/how-it-works') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
              <Link
                href="/about"
                className={cn(
                  "hover:text-foreground transition-colors py-1 relative",
                  pathname.startsWith('/about') && "text-foreground font-bold"
                )}
              >
                About
                {pathname.startsWith('/about') && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
              <Link
                href="/for-companies"
                className={cn(
                  "hover:text-foreground transition-colors py-1 relative",
                  pathname.startsWith('/for-companies') ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                For Companies
                {pathname.startsWith('/for-companies') && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-primary rounded-full" />
                )}
              </Link>
            </nav>
          )}

          <div className={cn("relative z-10 flex items-center justify-end gap-3 shrink-0", isApp && "flex-1")}>
            {!hideAuthButtons && (
              <>
                <Link href="/login" className="hidden md:flex items-center justify-center">
                  <span className="text-sm font-semibold text-foreground hover:text-primary px-3 py-2 transition-colors cursor-pointer">
                    Sign In
                  </span>
                </Link>
                <Link href="/signup" className="flex items-center justify-center">
                  <Button className="h-10 px-6 rounded-full bg-primary hover:bg-primary/90 transition-all active:scale-95 text-white font-bold border-0 text-sm shadow-sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            <button
              className="md:hidden p-1.5 text-foreground flex items-center justify-center outline-none active:scale-95 transition-transform"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-md md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-[60px] left-0 right-0 z-50 bg-card border-b border-border/40 shadow-2xl md:hidden overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-6">
                <nav className="flex flex-col gap-5">
                  <Link href="/explore" className="text-base font-bold text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Explore Causes
                  </Link>
                  <Link href="/how-it-works" className="text-base font-bold text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                    How It Works
                  </Link>
                  <Link href="/about" className="text-base font-bold text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsMenuOpen(false)}>
                    About
                  </Link>
                  <Link href="/for-companies" className="text-base font-bold text-primary transition-colors flex items-center justify-between" onClick={() => setIsMenuOpen(false)}>
                    <span>For Companies</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </Link>
                  {!hideAuthButtons && (
                    <Link href="/login" className="text-base font-bold text-muted-foreground hover:text-foreground transition-colors pt-2 border-t border-border/40" onClick={() => setIsMenuOpen(false)}>
                      Sign In
                    </Link>
                  )}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});