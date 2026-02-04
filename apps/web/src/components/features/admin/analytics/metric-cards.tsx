'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Zap, Users2, TrendingUp, Wallet, ArrowRight } from 'lucide-react';
import { SmartCurrency } from '../../../ui/smart-currency';
import { cn } from '../../../../lib/utils/cn';

export function SectorAllocationCard({ data }: { data: Array<{ category: string; count: number; volume: string }> }) {
    // Sort by volume (monetary impact) descending
    const sortedData = [...data].sort((a, b) => Number(b.volume) - Number(a.volume)).slice(0, 5);
    const maxVolume = Math.max(...data.map(d => Number(d.volume)), 1);

    return (
        <Card className="col-span-1 lg:col-span-4 rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden h-[380px] flex flex-col">
            <CardHeader className="p-6 pb-2">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Capital Allocation by Sector
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 flex-1 overflow-y-auto no-scrollbar">
                <div className="space-y-4">
                    {sortedData.map((cat, i) => {
                        const percentOfMax = (Number(cat.volume) / maxVolume) * 100;
                        return (
                            <div key={i} className="group relative flex flex-col gap-2">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                            {cat.category}
                                        </p>
                                        <p className="text-[10px] font-medium text-muted-foreground">
                                            {cat.count} Active Projects
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <SmartCurrency
                                            amount={cat.volume}
                                            currency="NGN"
                                            visible={true}
                                            size="small"
                                            className="text-foreground font-black"
                                        />
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${percentOfMax}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
            <div className="p-4 bg-muted/20 border-t border-border/50 mt-auto">
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">
                    <span>Ranked by Volume</span>
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
        <Card className="col-span-1 lg:col-span-4 rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden h-[380px] flex flex-col">
            <CardHeader className="p-6 pb-2">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-blue-500" /> Account Demographics
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-center">
                <div className="space-y-8">
                    {/* Hero Metric */}
                    <div className="text-center space-y-1">
                        <p className="text-4xl font-black text-foreground tracking-tighter">{total}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Registered Entities</p>
                    </div>

                    {/* Split Visualization */}
                    <div className="space-y-4">
                        <div className="h-4 w-full flex rounded-full overflow-hidden border border-border/50 p-0.5 bg-secondary/30">
                            <div
                                className="h-full bg-blue-500 rounded-l-full transition-all duration-1000"
                                style={{ width: `${100 - organizerPercent}%` }}
                            />
                            <div
                                className="h-full bg-purple-500 rounded-r-full transition-all duration-1000"
                                style={{ width: `${organizerPercent}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 border-l-2 border-blue-500 pl-3">
                                <p className="text-[10px] font-black text-muted-foreground uppercase">Givers</p>
                                <p className="text-lg font-bold text-foreground">{individuals}</p>
                                <p className="text-[9px] font-bold text-blue-600 uppercase">Individual</p>
                            </div>
                            <div className="space-y-1 border-l-2 border-purple-500 pl-3">
                                <p className="text-[10px] font-black text-muted-foreground uppercase">Partners</p>
                                <p className="text-lg font-bold text-foreground">{organizers}</p>
                                <p className="text-[9px] font-bold text-purple-600 uppercase">Organizer</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <p className="text-[11px] text-primary font-medium leading-relaxed text-center">
                            <strong>Insight:</strong> Your ecosystem ratio is {Math.round(individuals / (organizers || 1))}:1. For every organizer, there are {Math.round(individuals / (organizers || 1))} potential givers.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}