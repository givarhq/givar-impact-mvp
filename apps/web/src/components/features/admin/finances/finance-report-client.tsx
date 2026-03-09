'use client';

import React, { memo } from 'react';
import {
    TrendingUp,
    ArrowDownLeft,
    ArrowUpRight,
    Landmark,
} from 'lucide-react';
import { FinanceFilterBar } from './finance-filter-bar';
import { CauseLeaderboard } from './cause-leaderboard';
import { Card } from '../../../ui/card';
import { SmartCurrency } from '../../../ui/smart-currency';
import { cn } from '../../../../lib/utils/cn';
import { motion } from 'framer-motion';

interface FinanceReportClientProps {
    categories: any[];
    report: any;
}

const KPICard = memo(function KPICard({ title, value, subValue, icon: Icon, color, bg, delay = 0 }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
        >
            <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden p-5 flex flex-col justify-between group hover:shadow-md transition-all h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                        "h-10 w-10 rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-transform group-hover:scale-110",
                        bg, color
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground line-clamp-2 leading-tight">
                        {title}
                    </p>
                </div>
                <div className="space-y-1">
                    <div className="min-h-[32px] flex items-baseline">
                        <SmartCurrency
                            amount={value}
                            currency="NGN"
                            visible={true}
                            size="default"
                            className="text-foreground text-xl md:text-2xl font-black"
                        />
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground truncate opacity-70">
                        {subValue}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
});

export const FinanceReportClient = memo(function FinanceReportClient({ categories, report }: FinanceReportClientProps) {
    if (!report) return null;

    return (
        <div className="space-y-6 md:space-y-10">
            <FinanceFilterBar categories={categories} />

            <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <KPICard
                        title="Gross Inflow"
                        value={report?.overview?.grossInflow || '0'}
                        subValue={`${report?.overview?.transactionCount || 0} Total Transactions`}
                        icon={ArrowDownLeft}
                        color="text-blue-500"
                        bg="bg-blue-500/10"
                        delay={0}
                    />
                    <KPICard
                        title="Capital Committed"
                        value={report.overview.committedCapital}
                        subValue="Assigned to Active Causes"
                        icon={TrendingUp}
                        color="text-primary"
                        bg="bg-primary/10"
                        delay={0.1}
                    />
                    <KPICard
                        title="Capital Deployed"
                        value={report.overview.deployedCapital}
                        subValue="Transferred to Verified Vendors"
                        icon={ArrowUpRight}
                        color="text-emerald-500"
                        bg="bg-emerald-500/10"
                        delay={0.2}
                    />
                    <KPICard
                        title="Total Revenue"
                        value={report.overview.platformRevenue}
                        subValue={
                            <span className="flex flex-col leading-tight mt-0.5">
                                <span className="flex items-center gap-1.5">
                                    Fees:
                                    <SmartCurrency
                                        amount={report?.overview?.platformFees || '0'}
                                        currency="NGN"
                                        visible={true}
                                        size="small"
                                        className="text-foreground"
                                    />
                                </span>

                                <span className="flex items-center gap-1.5">
                                    Tips:
                                    <SmartCurrency
                                        amount={report?.overview?.platformTips || '0'}
                                        currency="NGN"
                                        visible={true}
                                        size="small"
                                        className="text-foreground"
                                    />
                                </span>
                            </span>
                        }
                        icon={Landmark}
                        color="text-purple-500"
                        bg="bg-purple-500/10"
                        delay={0.3}
                    />
                </div>

                <CauseLeaderboard performance={report.performance} />
            </div>
        </div>
    );
});
