'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Heart } from 'lucide-react';
import { LandingHeader } from '../../components/layout/landing-header';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#fafafa]">
      {/* Global Landing Header */}
      <LandingHeader hideAuthButtons={true} variant="auth" />

      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">

        {/* LEFT PANEL: Visual Impact Flow */}
        <div className="relative hidden h-full flex-col bg-[#fafafa] lg:flex border-r border-border overflow-hidden p-12 pt-24">

          {/* Background Decorative Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none">
            <Image src="/Givar2.png" alt="" fill className="object-cover" />
          </div>
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full justify-center items-center">
            {/* Compact Container: Height reduced from 500px to 400px */}
            <div className="relative w-full max-w-md h-[400px]">

              {/* Connectors SVG - Recalibrated for tighter spacing */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400" fill="none">
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  d="M120,60 C120,110 250,80 250,130"
                  stroke="url(#gradient1)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: "easeInOut" }}
                  d="M250,200 C250,250 150,220 150,280"
                  stroke="url(#gradient1)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Step 1: You Give */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute top-0 left-4 bg-white rounded-2xl shadow-xl border border-border/50 p-4 flex items-center gap-4 w-[220px]"
              >
                <Image src="/hand.png" alt="" width={32} height={32} className="object-contain" />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground">You Give</p>
                  <p className="text-xs text-muted-foreground font-medium">Securely & instantly</p>
                </div>
              </motion.div>

              {/* Step 2: Impact Happens - Positioned closer to top */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="absolute top-[130px] right-4 bg-white rounded-2xl shadow-2xl border border-border/50 p-4 flex flex-col gap-2.5 w-[240px]"
              >
                <div className="flex items-center gap-4">
                  <Image src="/globe.png" alt="" width={36} height={36} className="object-contain" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground">Impact Happens</p>
                    <p className="text-xs text-muted-foreground font-medium">Track your donation</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100 w-fit">
                  <div className="h-1 w-1 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-amber-700">In Progress</span>
                </div>
              </motion.div>

              {/* Step 3: You Get Proof - Positioned closer to middle */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="absolute top-[280px] left-10 bg-white rounded-2xl shadow-xl border border-border/50 p-4 flex items-center gap-4 w-[220px]"
              >
                <Image src="/phone.png" alt="" width={28} height={28} className="object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground">You Get Proof</p>
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">Updates & receipts</p>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-600">
                      <CheckCircle2 size={8} /> Verified
                    </div>
                    <div className="flex items-center gap-1 text-[8px] font-bold text-primary">
                      <CheckCircle2 size={8} /> Delivered
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bottom Value Props */}
            <div className="mt-8 flex items-center gap-8">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground tracking-tight">
                <ShieldCheck size={20} className="text-primary" /> 100% Transparent
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground tracking-tight">
                <Zap size={20} className="text-primary" /> Secure
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground tracking-tight">
                <Heart size={20} className="text-primary" /> Real Impact
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Authentication Form Wrapper */}
        <div className="flex items-center justify-center p-6 lg:p-12 relative pt-24 lg:pt-16">
          <div className="mx-auto flex w-full flex-col justify-center sm:w-[420px]">
            {/* Form Card: Desktop styling with reduced padding */}
            <div className="lg:bg-card lg:border lg:border-border/40 lg:rounded-3xl lg:p-6 lg:shadow-sm">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CheckCircle2 = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);