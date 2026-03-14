'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui/button';
import { useEffect, useState, memo, useCallback } from 'react';
import { cn } from '../../lib/utils/cn';
import { LandingHeaderProps } from '../../types';

export const LandingHeader = memo(function LandingHeader({
  hideAuthButtons = false,
  variant = 'default',
}: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const isAuth = variant === 'auth';

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isAuth
          ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl py-4 shadow-sm'
          : scrolled
            ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-border/40 py-3 shadow-sm'
            : 'bg-transparent py-6'
      )}
    >
      <div className="container mx-auto px-4 md:px-6 relative flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group relative z-10 outline-none">
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

        {/* Desktop Nav */}
        <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8 text-sm font-semibold text-muted-foreground">
          <Link href="/explore" className="hover:text-primary transition-colors">
            Explore Causes
          </Link>
          <Link href="/how-it-works" className="hover:text-primary transition-colors">
            How It Works
          </Link>
          <Link href="/about" className="hover:text-primary transition-colors">
            About
          </Link>
        </nav>

        <div className="relative z-10 flex items-center justify-center gap-3">
          {/* Mobile About Link */}
          <Link href="/about" className="md:hidden text-sm font-bold text-muted-foreground hover:text-primary transition-colors px-2">
            About
          </Link>

          {!hideAuthButtons && (
            <>
              <Link href="/login" className="flex items-center justify-center">
                <Button
                  variant="ghost"
                  className="hidden md:flex w-auto text-foreground hover:text-primary font-bold hover:bg-primary/5 rounded-full px-6 transition-all"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup" className="flex items-center justify-center">
                <Button className="w-auto rounded-full px-5 md:px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95 text-white font-bold border-0 text-sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
});