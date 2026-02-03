'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Area, ReferenceLine
} from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../../../lib/utils/format';

interface FinancialTrendChartProps {
    data: Array<{ date: string; volume: string; donations: number }>;
    title: string;
    subtitle: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card/95 backdrop-blur-2xl border border-border/50 p-4 rounded-2xl shadow-2xl min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
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
    // Transform BigInt strings to numbers for Recharts
    const chartData = data.map(d => ({
        ...d,
        volumeValue: Number(d.volume) / 100, // Convert to major units
        dateShort: d.date.split('-').slice(1).join('/') // MM/DD
    }));

    return (
        <Card className="rounded-[32px] border-border/50 bg-card shadow-xl shadow-primary/5 overflow-hidden flex flex-col h-[420px]">
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
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />

                            <XAxis
                                dataKey="dateShort"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                                dy={10}
                                minTickGap={30}
                            />

                            {/* Left Axis: Volume */}
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                                tickFormatter={(val) => `₦${(val / 1000000).toFixed(1)}M`}
                                width={60}
                            />

                            {/* Right Axis: Count */}
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                                width={40}
                            />

                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />

                            {/* Donations Bar (Background) */}
                            <Bar
                                yAxisId="right"
                                dataKey="donations"
                                barSize={24}
                                fill="#3b82f6"
                                radius={[6, 6, 0, 0]}
                                opacity={0.2}
                            />

                            {/* Volume Area (Foreground) */}
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="volumeValue"
                                stroke="#10b981"
                                strokeWidth={3}
                                fill="url(#volumeGradient)"
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}