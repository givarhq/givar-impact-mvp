'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Zap } from 'lucide-react';
import { TabsList, TabsTrigger } from '../../ui/tabs';
import { SmartCurrency } from '../../ui/smart-currency';

interface DashboardHeroProps {
    firstName: string;
    totalImpact: string;
    donationCount: number;
}

export function DashboardHero({ firstName, totalImpact, donationCount }: DashboardHeroProps) {
    return (
        <div className="flex flex-col gap-4 md:gap-6 py-2">
            {/* Mobile Title - Only visible on small screens */}
            <div className="md:hidden">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Overview</h1>
            </div>

            <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
                {/* User Stats Summary */}
                <div className="space-y-0.5">
                    <p className="text-sm font-medium text-muted-foreground">
                        Welcome, <span className="text-foreground font-bold">{firstName}</span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5" />
                            Impact: <span className="font-bold text-foreground">
                                <SmartCurrency amount={totalImpact} currency="NGN" visible={true} size="small" />
                            </span>
                        </span>
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <span>{donationCount} donations</span>
                    </div>
                </div>

                {/* Unified Tab Switcher Design */}
                <div className="w-full md:w-auto">
                    <TabsList className="h-11 bg-muted/50 p-1 rounded-3xl w-full md:w-[280px] border border-border/40 shadow-inner">
                        <TabsTrigger
                            value="discovery"
                            className="flex-1 h-full rounded-3xl gap-2 text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                        >
                            <Zap className="h-3.5 w-3.5" />
                            Discovery
                        </TabsTrigger>
                        <TabsTrigger
                            value="portfolio"
                            className="flex-1 h-full rounded-3xl gap-2 text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                        >
                            <TrendingUp className="h-3.5 w-3.5" />
                            Impact
                        </TabsTrigger>
                    </TabsList>
                </div>
            </motion.div>
        </div>
    );
}