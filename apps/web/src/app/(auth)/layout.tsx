import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LandingHeader } from '../../components/layout/landing-header';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background">

      {/* Global Header */}
      <LandingHeader hideAuthButtons={true} variant="auth" />

      {/* 
        FIX: Removed 'pt-20' from this parent grid. 
        The grid now starts at the very top of the viewport (y=0).
      */}
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">

        {/* 
          LEFT COLUMN 
          FIX: Added 'pt-24' here. 
          The background/border extends to top, but content starts below header.
        */}
        <div className="relative hidden h-full flex-col bg-background p-10 lg:flex border-r border-border overflow-hidden pt-24">

          {/* Background Effects */}
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

          {/* GIVAR2 Pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <Image
              src="/Givar2.png"
              alt=""
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="flex justify-center w-full">
                <Image
                  src="/Givar1.png"
                  alt="Givar Logo"
                  width={150}
                  height={150}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Centered Marketing Copy & Tags */}
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="max-w-md w-full">
                <h2 className="text-3xl font-bold leading-tight mb-4 tracking-tight text-foreground text-justify">
                  Making generosity simple, transparent, & impactful.
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed text-justify">
                  Join thousands of givers changing the world one transaction at a time.
                  Real-time tracking, zero-friction donations, & verified causes.
                </p>

                {/* Footer Tags */}
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-mono mt-12">
                  <span>SECURE LEDGER</span>
                  <span>•</span>
                  <span>VERIFIED IMPACT</span>
                  <span>•</span>
                  <span>ISO 27001</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 
          RIGHT COLUMN 
          FIX: Added 'pt-24' here (& adjusted mobile padding).
          This ensures form doesn't go under header, but scroll is smooth.
        */}
        <div className="flex items-center justify-center p-6 lg:p-12 pt-24 lg:pt-24 relative">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
            {children}

            <div className="text-center text-xs text-muted-foreground mt-4">
              By continuing, you agree to our{' '}
              <Link href="#" className="underline hover:text-primary">
                Terms
              </Link>{' '}
              &{' '}
              <Link href="#" className="underline hover:text-primary">
                Privacy Policy
              </Link>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}