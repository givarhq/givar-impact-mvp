'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Zap, Users2, TrendingUp } from 'lucide-react';
import { SmartCurrency } from '../../../ui/smart-currency';
import { cn } from '../../../../lib/utils/cn';

export function SectorAllocationCard({ data }: { data: Array<{ category: string; count: number; volume: string }> }) {
    const sortedData = [...data].sort((a, b) => Number(b.volume) - Number(a.volume)).slice(0, 5);
    const maxVolume = Math.max(...data.map(d => Number(d.volume)), 1);

    return (
        <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden h-[380px] flex flex-col">
            <CardHeader className="p-5 md:p-6 pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Sector allocation
                </CardTitle>
            </CardHeader>
            <CardContent className="p-5 md:p-6 pt-2 flex-1 overflow-y-auto no-scrollbar">
                <div className="space-y-4">
                    {sortedData.map((cat, i) => {
                        const percentOfMax = (Number(cat.volume) / maxVolume) * 100;
                        return (
                            <div key={i} className="group relative flex flex-col gap-1.5">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                        <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                            {cat.category}
                                        </p>
                                        <p className="text-[10px] font-medium text-muted-foreground">
                                            {cat.count} active projects
                                        </p>
                                    </div>
                                    <div className="text-right pl-4">
                                        <SmartCurrency
                                            amount={cat.volume}
                                            currency="NGN"
                                            visible={true}
                                            size="small"
                                            className="text-foreground font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden border border-border/10">
                                    <div
                                        className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${percentOfMax}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
            <div className="p-4 bg-muted/20 border-t border-border/40 mt-auto">
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">
                    <span>Ranked by liquidity</span>
                    <TrendingUp className="h-3 w-3" />
                </div>
            </div>
        </Card>
    );
}

export function EntityCompositionCard({ data }: { data: Array<{ type: string; count: number }> }) {
    const total = data.reduce((acc, curr) => acc + curr.count, 0);
    const organizers = data.find(d => d.type === 'ORGANIZER')?.count || 0;
    const individuals = data.find(d => d.type === 'INDIVIDUAL')?.count || 0;

    const organizerPercent = total > 0 ? (organizers / total) * 100 : 0;

    return (
        <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden h-[380px] flex flex-col">
            <CardHeader className="p-5 md:p-6 pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-primary" /> Account types
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-center">
                <div className="space-y-6">
                    <div className="text-center space-y-1">
                        <p className="text-3xl font-bold text-foreground tracking-tight leading-none">{total}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Registered entities</p>
                    </div>

                    <div className="space-y-4">
                        <div className="h-3 w-full flex rounded-full overflow-hidden border border-border/40 p-0.5 bg-muted/30">
                            <div
                                className="h-full bg-primary rounded-l-full transition-all duration-1000 ease-out"
                                style={{ width: `${100 - organizerPercent}%` }}
                            />
                            <div
                                className="h-full bg-blue-500 rounded-r-full transition-all duration-1000 ease-out"
                                style={{ width: `${organizerPercent}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-0.5 border-l-2 border-primary pl-3">
                                <p className="text-xs font-bold text-foreground leading-tight">Individuals</p>
                                <p className="text-sm font-black text-primary tabular-nums">{individuals}</p>
                            </div>
                            <div className="space-y-0.5 border-l-2 border-blue-500 pl-3">
                                <p className="text-xs font-bold text-foreground leading-tight">Organizers</p>
                                <p className="text-sm font-black text-blue-500 tabular-nums">{organizers}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <p className="text-[11px] text-primary font-semibold leading-relaxed text-center italic">
                            Ecosystem ratio: {Math.round(individuals / (organizers || 1))}:1 donor to organizer.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}