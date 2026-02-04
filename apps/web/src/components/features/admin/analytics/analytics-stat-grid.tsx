'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../ui/card';
import { SmartCurrency } from '../../../ui/smart-currency';
import { Users, AlertTriangle, Wallet, BarChart3, ChevronRight } from 'lucide-react';
import { cn } from '../../../../lib/utils/cn';

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Total Entities"
                value={summary.totalUsers}
                subValue={`${Math.abs(summary.userGrowthPercent)}% growth vs last month`}
                icon={Users}
                color="text-blue-500"
                bg="bg-blue-500/10"
                onClick={() => router.push('/admin/users')}
            />

            <StatCard
                title="System Liquidity"
                value={<SmartCurrency amount={summary.totalVolume.NGN} currency="NGN" visible={true} size="default" />}
                subValue="Cumulative volume processed"
                icon={Wallet}
                color="text-emerald-500"
                bg="bg-emerald-500/10"
                onClick={() => router.push('/admin/ledger?tab=reconcile')}
            />

            <StatCard
                title="Avg. Contribution"
                value={<SmartCurrency amount={avgDonation} currency="NGN" visible={true} size="default" />}
                subValue="Per successful transaction"
                icon={BarChart3}
                color="text-purple-500"
                bg="bg-purple-500/10"
            />

            <StatCard
                title="Risk Indicators"
                value={summary.unresolvedSuspenseCount}
                subValue={`${summary.pendingKycCount} KYC reviews pending`}
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
        <Card
            onClick={onClick}
            className={cn(
                "relative p-6 bg-card overflow-hidden rounded-[28px] transition-all duration-300 group",
                "shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
                onClick ? "cursor-pointer hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1" : "cursor-default",
                highlight && "ring-2 ring-amber-500/20 bg-amber-500/[0.02]"
            )}
        >
            {/* Background Decor */}
            <div className={cn("absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 scale-110", color)}>
                <Icon className="h-24 w-24" />
            </div>

            <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className={cn("h-12 w-12 rounded-[18px] flex items-center justify-center shadow-sm", bg, color)}>
                        <Icon className="h-6 w-6" />
                    </div>
                    {onClick && (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">{title}</p>
                    <div className="text-2xl font-black text-foreground tracking-tight">{value}</div>
                    <p className="text-[11px] font-bold text-muted-foreground mt-1">{subValue}</p>
                </div>
            </div>
        </Card>
    );
}