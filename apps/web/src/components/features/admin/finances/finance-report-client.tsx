'use client';

import React, { useEffect, useState, memo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    TrendingUp,
    ArrowDownLeft,
    ArrowUpRight,
    Activity,
    Loader2
} from 'lucide-react';
import { FinanceFilterBar } from './finance-filter-bar';
import { CauseLeaderboard } from './cause-leaderboard';
import { Card } from '../../../ui/card';
import { SmartCurrency } from '../../../ui/smart-currency';
import { ApiService } from '../../../../services/api';
import { cn } from '../../../../lib/utils/cn';
import { motion } from 'framer-motion';

interface FinanceReportClientProps {
    categories: any[];
    initialFilters: any;
}

const KPICard = memo(function KPICard({ title, value, subValue, icon: Icon, color, bg, isRawValue = false, delay = 0 }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
        >
            <Card className="rounded-[28px] border-border/40 bg-card shadow-sm overflow-hidden p-5 flex flex-col justify-between group hover:shadow-md transition-all h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                        "h-10 w-10 rounded-2xl flex items-center justify-center shadow-inner shrink-0 transition-transform group-hover:scale-110",
                        bg, color
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground truncate">
                        {title}
                    </p>
                </div>
                <div className="space-y-1">
                    <div className="min-h-[32px] flex items-baseline">
                        {isRawValue ? (
                            <h3 className="text-2xl font-black text-foreground tracking-tight">
                                {value}
                            </h3>
                        ) : (
                            <SmartCurrency
                                amount={value}
                                currency="NGN"
                                visible={true}
                                size="default"
                                className="text-foreground text-xl md:text-2xl font-black"
                            />
                        )}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground truncate opacity-70">
                        {subValue}
                    </p>
                </div>
            </Card>
        </motion.div>
    );
});

export const FinanceReportClient = memo(function FinanceReportClient({ categories }: FinanceReportClientProps) {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [report, setReport] = useState<any>(null);

    useEffect(() => {
        const fetchReport = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams(searchParams.toString());
                const data = await ApiService.admin.getFinanceReport(params);
                setReport(data);
            } catch (error) {
                console.error("Treasury Intelligence Fetch Failure", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [searchParams]);

    return (
        <div className="space-y-6 md:space-y-10">
            <FinanceFilterBar categories={categories} />

            {isLoading && !report ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-in fade-in duration-500">
                    <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground tracking-tight">
                        Compiling Treasury Intelligence Data...
                    </p>
                </div>
            ) : report ? (
                <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700">

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <KPICard
                            title="Gross Inflow"
                            value={report.overview.grossInflow}
                            subValue={`${report.overview.transactionCount} Successful Entries`}
                            icon={ArrowDownLeft}
                            color="text-blue-500"
                            bg="bg-blue-500/10"
                            delay={0}
                        />
                        <KPICard
                            title="Capital Committed"
                            value={report.overview.committedCapital}
                            subValue="Assigned To Active Causes"
                            icon={TrendingUp}
                            color="text-primary"
                            bg="bg-primary/10"
                            delay={0.1}
                        />
                        <KPICard
                            title="Capital Deployed"
                            value={report.overview.deployedCapital}
                            subValue="Transferred To Verified Vendors"
                            icon={ArrowUpRight}
                            color="text-emerald-500"
                            bg="bg-emerald-500/10"
                            delay={0.2}
                        />
                        <KPICard
                            title="Efficiency Ratio"
                            value={`${report.overview.efficiencyRatio.toFixed(1)}%`}
                            subValue="Inflow To Deployment Ratio"
                            icon={Activity}
                            color="text-purple-500"
                            bg="bg-purple-500/10"
                            isRawValue
                            delay={0.3}
                        />
                    </div>

                    <CauseLeaderboard performance={report.performance} />
                </div>
            ) : null}
        </div>
    );
});