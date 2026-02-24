'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useEffect, useState, memo } from 'react';
import { cn } from '../../lib/utils/cn';
import { LandingHeaderProps } from '../../types';

export const LandingHeader = memo(function LandingHeader({
  hideAuthButtons = false,
  variant = 'default',
}: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const isAuth = variant === 'auth';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isAuth
          ? 'bg-background border-b border-border/40 py-4'
          : scrolled
            ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-border/40 py-3 shadow-sm'
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

        {/* Centered Nav */}
        <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8 text-sm font-semibold text-muted-foreground">
          <Link href="/explore" className="hover:text-primary transition-colors">
            Explore Causes
          </Link>
          <Link href="/#how-it-works" className="hover:text-primary transition-colors">
            How It Works
          </Link>
          <Link href="/about" className="hover:text-primary transition-colors">
            Our Mission
          </Link>
        </nav>

        <div className="relative z-10 flex items-center gap-3">
          {!hideAuthButtons && (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="hidden md:flex text-foreground hover:text-primary font-bold hover:bg-primary/5 rounded-full px-6 transition-all"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="rounded-full px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95 text-white font-bold border-0">
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