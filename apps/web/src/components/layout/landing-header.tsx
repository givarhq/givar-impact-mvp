'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils/cn';
import { LandingHeaderProps } from '../../types';

export function LandingHeader({
  hideAuthButtons = false,
  variant = 'default',
}: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const isAuth = variant === 'auth';
  
  // SOTA Theme Logic:
  // If we are on the landing page (default) AND haven't scrolled yet,
  // we are sitting on top of a Dark Hero image. Text must be white.
  // Otherwise, use standard system colors.
  const isDarkHeroState = !isAuth && !scrolled;

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
          ? 'bg-background border-border py-4'
          : scrolled
          ? 'bg-background/80 backdrop-blur-xl border-border/40 py-3 shadow-sm'
          : 'bg-transparent py-6'
      )}
    >
      <div className="container mx-auto px-4 md:px-6 relative flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group relative z-10">
          <div>
            <Image
              src="/Givar1.png"
              alt="Givar Logo"
              width={30}
              height={30}
              className="object-contain"
              priority
            />
          </div>
          <span className={cn(
              "text-xl font-bold tracking-tight transition-colors",
              isDarkHeroState ? "text-white" : "text-foreground"
          )}>
            Givar<span className="text-primary">.</span>
          </span>
        </Link>

        {/* Centered Nav with Dynamic Colors */}
        <nav className={cn(
            "hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8 text-sm font-medium transition-colors",
            isDarkHeroState ? "text-zinc-200" : "text-muted-foreground"
        )}>
          <Link href="/#features" className={cn("transition-colors", isDarkHeroState ? "hover:text-white" : "hover:text-primary")}>
            How it Works
          </Link>
          <Link href="/#impact" className={cn("transition-colors", isDarkHeroState ? "hover:text-white" : "hover:text-primary")}>
            Transparency
          </Link>
          <Link href="/#projects" className={cn("transition-colors", isDarkHeroState ? "hover:text-white" : "hover:text-primary")}>
            Explore Projects
          </Link>
        </nav>

        <div className="relative z-10 flex items-center gap-3">
          {!hideAuthButtons && (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className={cn(
                      "hidden md:flex transition-colors",
                      isDarkHeroState 
                        ? "text-zinc-200 hover:text-white hover:bg-white/10" 
                        : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className={cn(
                    "rounded-full px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all",
                    // Add extra glow/contrast when on dark hero
                    isDarkHeroState && "shadow-primary/40 border border-white/10"
                )}>
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}