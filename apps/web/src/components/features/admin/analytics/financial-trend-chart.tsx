'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import {
    ComposedChart, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Area, Bar
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../../../lib/utils/format';

interface FinancialTrendChartProps {
    data: Array<{ date: string; volume: string; donations: number }>;
    title: string;
    subtitle: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const volume = payload.find((p: any) => p.dataKey === 'volumeValue')?.value || 0;
        const count = payload.find((p: any) => p.dataKey === 'donations')?.value || 0;

        return (
            <div className="bg-card border border-border/60 shadow-xl p-3 rounded-2xl min-w-[160px] animate-in fade-in zoom-in-95 duration-100">
                <p className="text-[11px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                    {label}
                </p>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-primary flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Volume
                        </span>
                        <span className="text-xs font-bold text-foreground tabular-nums">
                            {formatCurrency(volume * 100, 'NGN')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-blue-500 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Count
                        </span>
                        <span className="text-xs font-bold text-foreground tabular-nums">
                            {count}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export function FinancialTrendChart({ data, title, subtitle }: FinancialTrendChartProps) {
    const chartData = data.map(d => ({
        ...d,
        volumeValue: Number(d.volume) / 100,
        dateShort: d.date.split('-').slice(1).join('/')
    }));

    return (
        <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden flex flex-col h-[380px]">
            <CardHeader className="p-5 md:p-6 pb-2 flex flex-row items-center justify-between">
                <div className="space-y-0.5">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" /> {title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 text-primary">
                        <div className="w-2 h-1 rounded-full bg-primary" /> Liquidity
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-500">
                        <div className="w-2 h-1 rounded-full bg-blue-500" /> Frequency
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                            <defs>
                                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />

                            <XAxis
                                dataKey="dateShort"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                                dy={10}
                            />

                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                                tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`}
                            />

                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                            />

                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} isAnimationActive={false} />

                            <Bar
                                yAxisId="right"
                                dataKey="donations"
                                barSize={16}
                                fill="#3b82f6"
                                radius={[3, 3, 0, 0]}
                                opacity={0.2}
                            />

                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="volumeValue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fill="url(#volumeGradient)"
                                activeDot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}