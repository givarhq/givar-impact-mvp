'use client';

import React from 'react';
import { Card } from '../../../ui/card';
import { SmartCurrency } from '../../../ui/smart-currency';
import { TrendingUp, Users, LayoutGrid, AlertTriangle, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { cn } from '../../../../lib/utils/cn';

interface AnalyticsStatGridProps {
    summary: any;
    avgDonation: string;
}

export function AnalyticsStatGrid({ summary, avgDonation }: AnalyticsStatGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Total Entities"
                value={summary.totalUsers}
                subValue={`${Math.abs(summary.userGrowthPercent)}% ${summary.userGrowthPercent >= 0 ? 'growth' : 'churn'}`}
                trend={summary.userGrowthPercent >= 0 ? 'up' : 'down'}
                icon={Users}
                color="text-blue-500"
                bg="bg-blue-500/10"
                delay={0}
            />

            <StatCard
                title="System Liquidity"
                value={<SmartCurrency amount={summary.totalVolume.NGN} currency="NGN" visible={true} size="small" />}
                subValue="Total volume processed"
                icon={Wallet}
                color="text-emerald-500"
                bg="bg-emerald-500/10"
                delay={100}
            />

            <StatCard
                title="Avg. Contribution"
                value={<SmartCurrency amount={avgDonation} currency="NGN" visible={true} size="small" />}
                subValue="Per successful transaction"
                icon={LayoutGrid}
                color="text-purple-500"
                bg="bg-purple-500/10"
                delay={200}
            />

            <StatCard
                title="Risk Indicators"
                value={summary.unresolvedSuspenseCount}
                subValue={`${summary.pendingKycCount} Pending KYC Reviews`}
                icon={AlertTriangle}
                color="text-amber-500"
                bg="bg-amber-500/10"
                highlight={summary.unresolvedSuspenseCount > 0}
                delay={300}
            />
        </div>
    );
}

function StatCard({ title, value, subValue, icon: Icon, color, bg, trend, highlight, delay }: any) {
    return (
        <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards opacity-0"
            style={{ animationDelay: `${delay}ms` }}
        >
            <Card className={cn(
                "relative p-6 bg-card border-none overflow-hidden rounded-[28px] transition-all duration-300 group",
                // SOTA Soft Shadows
                "shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]",
                "hover:-translate-y-1",
                highlight && "ring-2 ring-amber-500/20"
            )}>
                {/* Background Decor */}
                <div className={cn("absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 scale-110 group-hover:scale-125 transform origin-top-right", color)}>
                    <Icon className="h-24 w-24" />
                </div>

                <div className="flex flex-col h-full justify-between relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className={cn("h-12 w-12 rounded-[18px] flex items-center justify-center shadow-sm ring-1 ring-inset ring-black/5", bg, color)}>
                            <Icon className="h-6 w-6" />
                        </div>
                        {trend && (
                            <div className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                trend === 'up'
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : "bg-destructive/10 text-destructive border-destructive/20"
                            )}>
                                {trend === 'up' ? <ArrowUpRight className="h-3 w-3 stroke-[3px]" /> : <ArrowDownRight className="h-3 w-3 stroke-[3px]" />}
                                {trend === 'up' ? 'Up' : 'Down'}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">{title}</p>
                        <div className="text-2xl font-black text-foreground tracking-tight flex items-baseline">{value}</div>
                        <p className="text-[11px] font-bold text-muted-foreground mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {subValue}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}