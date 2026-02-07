'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Compass, TrendingUp, Zap } from 'lucide-react';
import { TabsList, TabsTrigger } from '../../ui/tabs';
import { SmartCurrency } from '../../ui/smart-currency';

interface DashboardHeroProps {
    firstName: string;
    totalImpact: string;
    donationCount: number;
}

export function DashboardHero({ firstName, totalImpact, donationCount }: DashboardHeroProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 py-2"
        >
            {/* Identity & Stats */}
            <div className="space-y-1 w-full md:w-auto">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Welcome back, {firstName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground justify-start">
                    <span className="flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Lifetime Impact:
                    </span>
                    <span className="font-bold text-foreground">
                        <SmartCurrency amount={totalImpact} currency="NGN" visible={true} size="small" />
                    </span>
                    <span className="hidden sm:inline opacity-50">•</span>
                    <span className="w-full sm:w-auto">{donationCount} Donations</span>
                </div>
            </div>

            {/* Tab Switcher - Replaces My Impact / Explore Buttons */}
            <div className="w-full md:w-auto pt-2 md:pt-0">
                <TabsList className="h-12 bg-muted/50 p-1 rounded-[18px] w-full md:w-[320px] border border-border/40">
                    <TabsTrigger
                        value="discovery"
                        className="flex-1 h-full rounded-xl gap-2 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md"
                    >
                        <Zap className="h-3.5 w-3.5" />
                        Discovery
                    </TabsTrigger>
                    <TabsTrigger
                        value="portfolio"
                        className="flex-1 h-full rounded-xl gap-2 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md"
                    >
                        <TrendingUp className="h-3.5 w-3.5" />
                        My Impact
                    </TabsTrigger>
                </TabsList>
            </div>
        </motion.div>
    );
}