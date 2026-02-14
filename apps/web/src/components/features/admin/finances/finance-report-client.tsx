'use client';

import React, { useEffect, useState } from 'react';
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

interface FinanceReportClientProps {
    categories: any[];
    initialFilters: any;
}

export function FinanceReportClient({ categories }: FinanceReportClientProps) {
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
                console.error("Treasury report fetch failure", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [searchParams]);

    return (
        <div className="space-y-6 md:space-y-8">
            <FinanceFilterBar categories={categories} />

            {isLoading && !report ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Compiling treasury data...
                    </p>
                </div>
            ) : report ? (
                <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">

                    {/* Compact 2x2 Mobile / 4x1 Desktop Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                        <KPICard
                            title="Gross Inflow"
                            value={report.overview.grossInflow}
                            subValue={`${report.overview.transactionCount} entries`}
                            icon={ArrowDownLeft}
                            color="text-blue-500"
                            bg="bg-blue-500/10"
                        />
                        <KPICard
                            title="Capital Committed"
                            value={report.overview.committedCapital}
                            subValue="Assigned to causes"
                            icon={TrendingUp}
                            color="text-primary"
                            bg="bg-primary/10"
                        />
                        <KPICard
                            title="Capital Deployed"
                            value={report.overview.deployedCapital}
                            subValue="Moved to vendors"
                            icon={ArrowUpRight}
                            color="text-emerald-500"
                            bg="bg-emerald-500/10"
                        />
                        <KPICard
                            title="Efficiency Ratio"
                            value={`${report.overview.efficiencyRatio.toFixed(1)}%`}
                            subValue="Inflow vs Deployment"
                            icon={Activity}
                            color="text-purple-500"
                            bg="bg-purple-500/10"
                            isRawValue
                        />
                    </div>

                    <CauseLeaderboard performance={report.performance} />

                </div>
            ) : null}
        </div>
    );
}

function KPICard({ title, value, subValue, icon: Icon, color, bg, isRawValue = false }: any) {
    return (
        <Card className="rounded-[28px] border-border/40 bg-card shadow-sm overflow-hidden p-3.5 md:p-4 flex flex-col justify-between group">
            <div className="flex items-center gap-2 mb-2.5 md:mb-3">
                <div className={cn(
                    "h-8 w-8 md:h-9 md:w-9 rounded-2xl flex items-center justify-center shadow-inner shrink-0",
                    bg, color
                )}>
                    <Icon className="h-4 w-4 md:h-4.5 md:w-4.5" />
                </div>
                <p className="text-xs md:text-sm font-semibold text-muted-foreground truncate">
                    {title}
                </p>
            </div>
            <div className="space-y-0.5">
                <div className="min-h-[28px] flex items-baseline">
                    {isRawValue ? (
                        <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                            {value}
                        </h3>
                    ) : (
                        <SmartCurrency
                            amount={value}
                            currency="NGN"
                            visible={true}
                            size="default"
                            className="text-foreground text-lg md:text-xl"
                        />
                    )}
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">
                    {subValue}
                </p>
            </div>
        </Card>
    );
}