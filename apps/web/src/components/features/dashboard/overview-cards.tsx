'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Heart, Activity, Globe, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { SmartCurrency } from '../../ui/smart-currency';
import { OverviewCardsProps } from '../../../types';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils/cn';
import { Button } from '../../ui/button';

export const OverviewCards = memo(function OverviewCards({ totalImpact, donationCount }: OverviewCardsProps) {
    const hasImpact = donationCount > 0;

    return (
        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-12">

            {/* Main Impact Card (Takes up 8 columns on large screens) */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:col-span-8"
            >
                <Card className="relative h-full min-h-[220px] overflow-hidden border-0 bg-zinc-950 shadow-lg">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none transform translate-x-10 -translate-y-10">
                        <Globe className="h-64 w-64 text-white" />
                    </div>
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

                    <CardContent className="p-6 md:p-8 h-full flex flex-col justify-between relative z-10 min-w-0">
                        <div className="flex justify-between items-start gap-4">
                            <div className="space-y-2 min-w-0">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold text-emerald-400 uppercase tracking-widest backdrop-blur-md">
                                    <Sparkles className="h-3 w-3" /> Global Impact
                                </div>
                                <h3 className="text-zinc-400 font-medium text-sm truncate">Your lifetime verifiable giving</h3>
                            </div>
                            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-md shrink-0 shadow-inner">
                                <Heart className="h-6 w-6 text-emerald-400 fill-emerald-400/20" />
                            </div>
                        </div>

                        <div className="mt-8 mb-4 min-w-0">
                            <SmartCurrency
                                amount={totalImpact}
                                currency="NGN"
                                visible={true}
                                className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white truncate max-w-full"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-auto pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2 text-zinc-300">
                                <Activity className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs md:text-sm font-bold">
                                    {donationCount} {donationCount === 1 ? 'Contribution' : 'Contributions'}
                                </span>
                            </div>
                            <span className="hidden sm:inline text-zinc-600 text-xs">•</span>
                            <span className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest">Secured on Ledger</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Secondary Action/Info Card (Takes up 4 columns on large screens) */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="lg:col-span-4"
            >
                <Card className={cn(
                    "relative h-full min-h-[220px] overflow-hidden rounded-3xl border shadow-sm flex flex-col justify-center transition-all group",
                    hasImpact
                        ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10"
                        : "bg-blue-50 border-blue-100 dark:bg-blue-500/5 dark:border-blue-500/10"
                )}>
                    <CardContent className="p-6 md:p-8 text-center flex flex-col items-center h-full justify-between">
                        <div className={cn(
                            "h-14 w-14 rounded-[24px] flex items-center justify-center mb-4 shadow-inner transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3",
                            hasImpact
                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                        )}>
                            {hasImpact ? <ShieldCheck className="h-7 w-7" /> : <Globe className="h-7 w-7" />}
                        </div>

                        <div className="space-y-1.5 mb-6">
                            <h3 className="font-bold text-foreground text-lg tracking-tight">
                                {hasImpact ? 'Immutable Record' : 'Start Your Journey'}
                            </h3>

                            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[220px] mx-auto">
                                {hasImpact
                                    ? "Every contribution you make is permanently secured and verifiable."
                                    : "Discover verified causes and make your first transparent contribution."}
                            </p>
                        </div>

                        <Link href={hasImpact ? "/dashboard/history" : "/explore"} className="w-full mt-auto">
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full rounded-full font-bold text-xs h-11 border-0 shadow-sm transition-all active:scale-95",
                                    hasImpact
                                        ? "bg-white hover:bg-emerald-100 text-emerald-700 dark:bg-zinc-900 dark:hover:bg-emerald-900/30 dark:text-emerald-400"
                                        : "bg-white hover:bg-blue-100 text-blue-700 dark:bg-zinc-900 dark:hover:bg-blue-900/30 dark:text-blue-400"
                                )}
                            >
                                {hasImpact ? 'View Receipts' : 'Explore Causes'} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
});