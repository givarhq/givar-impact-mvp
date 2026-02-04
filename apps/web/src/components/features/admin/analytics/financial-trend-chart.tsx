'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Area
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
        return (
            // FIX: Removed backdrop-blur to prevent text fuzziness during movement
            <div className="bg-card border border-border shadow-2xl p-4 rounded-xl min-w-[200px] animate-in fade-in zoom-in-95 duration-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                    {label}
                </p>
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-primary flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Volume
                        </span>
                        <span className="text-sm font-black text-foreground tabular-nums">
                            {formatCurrency(payload.find((p: any) => p.dataKey === 'volumeValue')?.value || 0, 'NGN')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-blue-500 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Tx Count
                        </span>
                        <span className="text-sm font-black text-foreground tabular-nums">
                            {payload.find((p: any) => p.dataKey === 'donations')?.value || 0}
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
        <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden flex flex-col h-[420px]">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                <div className="space-y-1.5">
                    <CardTitle className="text-sm font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" /> {title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 text-primary">
                        <div className="w-2 h-1 rounded-full bg-primary" /> Liquidity
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-500">
                        <div className="w-2 h-1 rounded-full bg-blue-500" /> Frequency
                    </span>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <defs>
                                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />

                            <XAxis
                                dataKey="dateShort"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                                dy={10}
                            />

                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                                tickFormatter={(val) => `₦${(val / 1000000).toFixed(1)}M`}
                                width={60}
                            />

                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                                width={40}
                            />

                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} isAnimationActive={false} />

                            <Bar
                                yAxisId="right"
                                dataKey="donations"
                                barSize={20}
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                opacity={0.3}
                            />

                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="volumeValue"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                fill="url(#volumeGradient)"
                                activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}