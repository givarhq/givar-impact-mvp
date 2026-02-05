'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart3, Compass } from 'lucide-react';
import { Button } from '../../ui/button';
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
                <h1 className="text-lg font-bold tracking-tight text-foreground">
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

            {/* Quick Actions - Row on mobile, Row on desktop */}
            <div className="flex items-center gap-2 w-full md:w-auto pt-2 md:pt-0">
                <Link href="/dashboard/portfolio" className="flex-1 md:flex-none">
                    <Button
                        variant="outline"
                        className="w-full h-10 rounded-xl px-4 text-xs font-bold border-border/60 hover:bg-muted/50 transition-all"
                    >
                        My Impact
                    </Button>
                </Link>
                <Link href="/dashboard/impact" className="flex-1 md:flex-none">
                    <Button
                        className="w-full h-10 rounded-xl px-5 text-xs font-bold shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95 border-0"
                    >
                        <Compass className="mr-2 h-3.5 w-3.5" /> Explore
                    </Button>
                </Link>
            </div>
        </motion.div>
    );
}