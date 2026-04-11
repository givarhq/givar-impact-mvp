'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Heart, ShieldCheck, ArrowRight, TrendingUp, PieChart } from 'lucide-react';
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

            {/* Main Impact Card (Takes up 7 columns) */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:col-span-7 xl:col-span-8"
            >
                <Card className="relative h-full min-h-[200px] overflow-hidden border-border/40 bg-card shadow-sm">
                    {/* Subtle background pattern */}
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                    <CardContent className="p-6 md:p-8 h-full flex flex-col justify-between relative z-10 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1 min-w-0">
                                <h3 className="text-muted-foreground font-medium text-sm">Total impact</h3>
                                <div className="min-w-0 overflow-hidden">
                                    <SmartCurrency
                                        amount={totalImpact}
                                        currency="NGN"
                                        visible={true}
                                        className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-foreground truncate block"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground font-medium pt-1">
                                    The total amount you have given to help others through Givar
                                </p>
                            </div>

                            {/* Most Supported Sectors / More Info */}
                            <div className="hidden sm:block shrink-0 bg-muted/30 p-4 rounded-3xl border border-border/40 min-w-[200px]">
                                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <PieChart className="h-3 w-3" /> Most supported
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs font-bold text-foreground">Medical</span>
                                        <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden max-w-[60px]">
                                            <div className="h-full bg-primary w-[70%]" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs font-bold text-foreground">Education</span>
                                        <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden max-w-[60px]">
                                            <div className="h-full bg-primary w-[40%]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-border/40">
                            <div className="flex items-center gap-2 text-foreground">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-xs font-bold">
                                    {donationCount} {donationCount === 1 ? 'Gift' : 'Gifts'} sent
                                </span>
                            </div>
                            <span className="text-muted-foreground/30 text-xs">•</span>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified on the public record
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Side Card (Takes up 5 columns) */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="lg:col-span-5 xl:col-span-4"
            >
                <Card className={cn(
                    "relative h-full min-h-[200px] overflow-hidden rounded-3xl border shadow-sm flex flex-col justify-center transition-all group",
                    hasImpact
                        ? "bg-primary/[0.03] border-primary/20"
                        : "bg-blue-50/50 border-blue-100"
                )}>
                    <CardContent className="p-6 md:p-8 text-center flex flex-col items-center h-full justify-between gap-4">
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0",
                            hasImpact ? "bg-primary/10 text-primary" : "bg-blue-100 text-blue-600"
                        )}>
                            {hasImpact ? <TrendingUp className="h-6 w-6" /> : <Heart className="h-6 w-6" />}
                        </div>

                        <div className="space-y-1">
                            <h3 className="font-bold text-foreground text-base tracking-tight">
                                {hasImpact ? 'Check your history' : 'Start your journey'}
                            </h3>

                            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[200px] mx-auto">
                                {hasImpact
                                    ? "View all your past gifts and download your impact receipts."
                                    : "Browse verified causes and make your first contribution today."}
                            </p>
                        </div>

                        <Link href={hasImpact ? "/dashboard/history" : "/dashboard/impact"} className="w-full">
                            <Button
                                className={cn(
                                    "w-full rounded-full font-bold text-xs h-10 shadow-sm border-0 transition-all active:scale-95",
                                    hasImpact ? "bg-primary text-white" : "bg-blue-600 text-white"
                                )}
                            >
                                {hasImpact ? 'View history' : 'Explore causes'} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
});