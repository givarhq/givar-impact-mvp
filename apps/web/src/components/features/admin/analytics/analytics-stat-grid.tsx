'use client';

import React, { memo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../ui/card';
import { SmartCurrency } from '../../../ui/smart-currency';
import {
    Users,
    AlertTriangle,
    Wallet,
    BarChart3,
    ChevronRight,
    ShieldAlert,
    FileSearch,
    FileWarning
} from 'lucide-react';
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
        dominantRisk: 'LEDGER_SUSPENSE' | 'KYC_PENDING' | 'EVIDENCE_AUDIT' | 'NONE';
        riskLabel: string;
        riskCount: number;
    };
    avgDonation?: string;
}

export const AnalyticsStatGrid = memo(function AnalyticsStatGrid({ summary, avgDonation = '0' }: AnalyticsStatGridProps) {
    const router = useRouter();

    const getRiskConfig = () => {
        switch (summary.dominantRisk) {
            case 'LEDGER_SUSPENSE':
                return {
                    icon: FileWarning,
                    path: '/admin/ledger',
                    color: 'text-rose-500',
                    bg: 'bg-rose-500/10'
                };
            case 'KYC_PENDING':
                return {
                    icon: ShieldAlert,
                    path: '/admin/verifications?tab=orgs',
                    color: 'text-amber-500',
                    bg: 'bg-amber-500/10'
                };
            case 'EVIDENCE_AUDIT':
                return {
                    icon: FileSearch,
                    path: '/admin/verifications?tab=evidence',
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/10'
                };
            default:
                return {
                    icon: AlertTriangle,
                    path: '/admin/verifications',
                    color: 'text-zinc-400',
                    bg: 'bg-muted'
                };
        }
    };

    const risk = getRiskConfig();

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <StatCard
                title="Total Entities"
                value={summary.totalUsers}
                subValue={`${Math.abs(summary.userGrowthPercent)}% Growth`}
                icon={Users}
                color="text-blue-500"
                bg="bg-blue-500/10"
                onClick={() => router.push('/admin/users')}
            />

            <StatCard
                title="System Liquidity"
                value={<SmartCurrency amount={summary.totalVolume.NGN} currency="NGN" visible={true} size="default" />}
                subValue="Processed Volume"
                icon={Wallet}
                color="text-emerald-500"
                bg="bg-emerald-500/10"
                onClick={() => router.push('/admin/ledger?tab=reconcile')}
            />

            <StatCard
                title="Avg. Contribution"
                value={<SmartCurrency amount={avgDonation} currency="NGN" visible={true} size="default" />}
                subValue="Per Gift"
                icon={BarChart3}
                color="text-purple-500"
                bg="bg-purple-500/10"
            />

            <StatCard
                title="Risk Indicators"
                value={summary.riskCount}
                subValue={summary.riskLabel}
                icon={risk.icon}
                color={risk.color}
                bg={risk.bg}
                highlight={summary.riskCount > 0}
                onClick={() => router.push(risk.path)}
            />
        </div>
    );
});

function StatCard({ title, value, subValue, icon: Icon, color, bg, highlight, onClick }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={onClick ? { y: -2, transition: { duration: 0.2 } } : {}}
            whileTap={onClick ? { scale: 0.98 } : {}}
            className="h-full"
        >
            <Card
                onClick={onClick}
                className={cn(
                    "relative p-3.5 md:p-5 bg-card overflow-hidden rounded-3xl transition-all duration-300 group h-full flex flex-col justify-between",
                    "border-border/40 shadow-sm",
                    onClick && "cursor-pointer hover:shadow-md hover:border-primary/20",
                    highlight && "ring-2 ring-primary/10 bg-primary/[0.01]"
                )}
            >
                <div className="relative z-10 space-y-3 md:space-y-4">
                    <div className="flex items-center gap-2.5 md:gap-3">
                        <div className={cn(
                            "h-8 w-8 md:h-9 md:w-9 rounded-2xl flex items-center justify-center shadow-sm border border-transparent shrink-0",
                            bg, color
                        )}>
                            <Icon className="h-4 md:h-4.5 w-4 md:w-4.5" />
                        </div>
                        <p className="text-xs md:text-sm font-bold text-muted-foreground/80 leading-tight">
                            {title}
                        </p>
                    </div>

                    <div className="space-y-0.5">
                        <div className="text-lg md:text-2xl font-bold text-foreground tracking-tight leading-none truncate">
                            {value}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] md:text-xs font-medium text-muted-foreground truncate opacity-80">
                                {subValue}
                            </p>
                            {onClick && (
                                <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary transition-all shrink-0 hidden md:block" />
                            )}
                        </div>
                    </div>
                </div>

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