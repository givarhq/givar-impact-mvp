'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../ui/card';
import { SmartCurrency } from '../../../ui/smart-currency';
import { Users, AlertTriangle, Wallet, BarChart3, ChevronRight } from 'lucide-react';
import { cn } from '../../../../lib/utils/cn';
import { motion } from 'framer-motion';

interface AnalyticsStatGridProps {
    summary: {
        totalUsers: number;
        userGrowthPercent: number;
        totalVolume: { NGN: string };
        activeProjects: number;
        pendingKycCount: number;
        unresolvedSuspenseCount: number;
    };
    avgDonation?: string;
}

export function AnalyticsStatGrid({ summary, avgDonation = '0' }: AnalyticsStatGridProps) {
    const router = useRouter();

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <StatCard
                title="Total entities"
                value={summary.totalUsers}
                subValue={`${Math.abs(summary.userGrowthPercent)}% growth`}
                icon={Users}
                color="text-blue-500"
                bg="bg-blue-500/10"
                onClick={() => router.push('/admin/users')}
            />

            <StatCard
                title="System liquidity"
                value={<SmartCurrency amount={summary.totalVolume.NGN} currency="NGN" visible={true} size="default" />}
                subValue="Processed volume"
                icon={Wallet}
                color="text-emerald-500"
                bg="bg-emerald-500/10"
                onClick={() => router.push('/admin/ledger?tab=reconcile')}
            />

            <StatCard
                title="Avg. contribution"
                value={<SmartCurrency amount={avgDonation} currency="NGN" visible={true} size="default" />}
                subValue="Per gift"
                icon={BarChart3}
                color="text-purple-500"
                bg="bg-purple-500/10"
            />

            <StatCard
                title="Risk indicators"
                value={summary.unresolvedSuspenseCount}
                subValue={`${summary.pendingKycCount} pending kyc`}
                icon={AlertTriangle}
                color="text-amber-500"
                bg="bg-amber-500/10"
                highlight={summary.unresolvedSuspenseCount > 0 || summary.pendingKycCount > 0}
                onClick={() => router.push('/admin/verifications')}
            />
        </div>
    );
}

function StatCard({ title, value, subValue, icon: Icon, color, bg, highlight, onClick }: any) {
    return (
        <motion.div
            whileHover={onClick ? { y: -1 } : {}}
            whileTap={onClick ? { scale: 0.98 } : {}}
            className="h-full"
        >
            <Card
                onClick={onClick}
                className={cn(
                    "relative p-3.5 md:p-5 bg-card overflow-hidden rounded-3xl transition-all duration-300 group h-full flex flex-col justify-between",
                    "border-border/40 shadow-sm",
                    onClick && "cursor-pointer hover:shadow-md hover:border-primary/20",
                    highlight && "ring-2 ring-amber-500/20 bg-amber-500/[0.01]"
                )}
            >
                <div className="relative z-10 space-y-3 md:space-y-4">
                    {/* Header: Icon and Title aligned horizontally */}
                    <div className="flex items-center gap-2.5 md:gap-3">
                        <div className={cn(
                            "h-8 w-8 md:h-9 md:w-9 rounded-2xl flex items-center justify-center shadow-sm border border-transparent shrink-0",
                            bg, color
                        )}>
                            <Icon className="h-4 md:h-4.5 w-4 md:w-4.5" />
                        </div>
                        <p className="text-xs md:text-xs font-bold text-muted-foreground/80 leading-tight">
                            {title}
                        </p>
                    </div>

                    {/* Data: Value and Subtext */}
                    <div className="space-y-0.5">
                        <div className="text-lg md:text-2xl font-bold text-foreground tracking-tight leading-none truncate">
                            {value}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs md:text-xs font-medium text-muted-foreground truncate opacity-80">
                                {subValue}
                            </p>
                            {onClick && (
                                <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-all shrink-0 hidden md:block" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Subtle background decoration */}
                <div className={cn(
                    "absolute -bottom-2 -right-2 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none",
                    color
                )}>
                    <Icon className="h-16 w-16 md:h-20 md:w-20 rotate-12" />
                </div>
            </Card>
        </motion.div>
    );
}