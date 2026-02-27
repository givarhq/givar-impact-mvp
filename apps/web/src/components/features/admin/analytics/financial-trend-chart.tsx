'use client';

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import {
    ComposedChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Bar,
    Line,
    Cell
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { formatCurrency } from '../../../../lib/utils/format';
import { cn } from '../../../../lib/utils/cn';

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
            <div className="bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 rounded-2xl min-w-[200px] animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        Entry Date
                    </p>
                    <p className="text-[10px] font-bold text-zinc-200">{label}</p>
                </div>
                <div className="space-y-3">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">Liquidity Volume</span>
                        <span className="text-sm font-black text-white tabular-nums">
                            {formatCurrency(volume * 100, 'NGN')}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-0.5">Donation Frequency</span>
                        <span className="text-sm font-black text-white tabular-nums">
                            {count} <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Gifts</span>
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export const FinancialTrendChart = memo(function FinancialTrendChart({ data, title, subtitle }: FinancialTrendChartProps) {
    const chartData = React.useMemo(() => data.map(d => ({
        ...d,
        volumeValue: Number(d.volume) / 100,
        dateShort: d.date.split('-').slice(1).join('/')
    })), [data]);

    return (
        <Card className="rounded-3xl border-border/40 bg-card shadow-xl overflow-hidden flex flex-col h-[380px] group/chart">
            <CardHeader className="p-6 md:p-8 pb-2 flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-widest">
                        <TrendingUp className="h-4 w-4 text-primary" /> {title}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-tight opacity-60">{subtitle}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-0.5 w-4 bg-blue-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Flow</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 flex-1 min-h-0">
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="hsl(var(--border))"
                                opacity={0.3}
                            />

                            <XAxis
                                dataKey="dateShort"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 800 }}
                                dy={10}
                            />

                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 800 }}
                                tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`}
                            />

                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                hide
                            />

                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: 'hsl(var(--muted)/0.2)', radius: 8 }}
                                isAnimationActive={false}
                            />

                            <Bar
                                yAxisId="left"
                                dataKey="volumeValue"
                                radius={[6, 6, 0, 0]}
                                barSize={18}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill="url(#barGradient)"
                                        className="transition-all duration-300 hover:opacity-100 opacity-80"
                                    />
                                ))}
                            </Bar>

                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="donations"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }}
                                animationDuration={2000}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
            <div className="px-6 py-3 bg-muted/20 border-t border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-primary animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Live Data Sync Active</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-muted-foreground opacity-40">LEDGER_VELOCITY_V2</span>
            </div>
        </Card>
    );
});