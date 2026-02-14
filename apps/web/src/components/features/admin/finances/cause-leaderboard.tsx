'use client';

import React from 'react';
import {
    Target,
    AlertCircle,
    ArrowUpRight,
    ShieldCheck,
    PieChart,
    BarChart3,
    Activity,
    Database,
    TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { SmartCurrency } from '../../../ui/smart-currency';
import { cn } from '../../../../lib/utils/cn';
import { Badge } from '../../../ui/badge';

interface CauseLeaderboardProps {
    performance: {
        topPerformers: any[];
        leastPerformers: any[];
        mostFundedSectors: any[];
        leastFundedSectors: any[];
    };
}

export function CauseLeaderboard({ performance }: CauseLeaderboardProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Top Performing Causes */}
            <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden flex flex-col h-[480px]">
                <CardHeader className="bg-primary/[0.02] border-b border-border/40 p-5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" /> Most performing causes
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto no-scrollbar">
                    {performance.topPerformers.length > 0 ? (
                        <div className="divide-y divide-border/40">
                            {performance.topPerformers.map((p) => (
                                <PerformanceRow key={p.id} project={p} isPositive />
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="No performance data for this range" />
                    )}
                </CardContent>
            </Card>

            {/* Least Performing Causes */}
            <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden flex flex-col h-[480px]">
                <CardHeader className="bg-rose-500/[0.02] border-b border-border/40 p-5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-500" /> Least performing causes
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto no-scrollbar">
                    {performance.leastPerformers.length > 0 ? (
                        <div className="divide-y divide-border/40">
                            {performance.leastPerformers.map((p) => (
                                <PerformanceRow key={p.id} project={p} isPositive={false} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="All projects are performing above threshold" />
                    )}
                </CardContent>
            </Card>

            {/* Sector/Category Performance */}
            <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden lg:col-span-2">
                <CardHeader className="bg-muted/30 border-b border-border/40 p-5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-blue-500" /> Sector funding velocity
                    </CardTitle>
                </CardHeader>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {performance.mostFundedSectors.map((sector) => (
                            <div key={sector.id} className="p-4 rounded-3xl bg-muted/20 border border-border/40 space-y-3">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-xs font-bold text-foreground truncate max-w-[150px]">{sector.name}</h4>
                                    <Badge variant="outline" className="text-[10px] rounded-3xl border-primary/20 text-primary bg-primary/5">{sector.avgFundingRate}% rate</Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Volume</p>
                                    <SmartCurrency amount={sector.volume} currency="NGN" visible={true} size="default" />
                                </div>
                                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${sector.avgFundingRate}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}

function PerformanceRow({ project, isPositive }: { project: any, isPositive: boolean }) {
    return (
        <div className="p-5 hover:bg-muted/20 transition-colors flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate leading-tight mb-1">{project.title}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span>{project.category?.name}</span>
                    <span className="text-border">|</span>
                    <SmartCurrency amount={project.raisedAmount} currency={project.currency} visible={true} size="small" />
                </div>
            </div>
            <div className="text-right shrink-0">
                <p className={cn(
                    "text-lg font-black tabular-nums tracking-tighter",
                    isPositive ? "text-primary" : "text-rose-500"
                )}>
                    {project.fundingRate}%
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Rate</p>
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Database className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-xs font-medium text-muted-foreground italic">{message}</p>
        </div>
    );
}