'use client';

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import {
    ComposedChart, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Area, Bar, Line
} from 'recharts';
import { TrendingUp, Wallet, Activity } from 'lucide-react';
import { formatCurrency } from '../../../../lib/utils/format';
import { motion } from 'framer-motion';

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
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card/95 backdrop-blur-xl border border-border/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] p-4 rounded-3xl min-w-[200px]"
            >
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/40">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-[11px] font-black tracking-widest text-muted-foreground uppercase">
                        {label}
                    </p>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Wallet className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-bold">Capital</span>
                        </div>
                        <span className="text-sm font-black text-foreground tabular-nums">
                            {formatCurrency(volume * 100, 'NGN')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Activity className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs font-bold">Frequency</span>
                        </div>
                        <span className="text-sm font-bold text-foreground tabular-nums">
                            {count} <span className="text-[10px] text-muted-foreground/60 ml-0.5">TXNs</span>
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    }
    return null;
};

// Logic: Use React.memo to skip re-renders unless the data array reference changes.
export const FinancialTrendChart = memo(function FinancialTrendChart({ data, title, subtitle }: FinancialTrendChartProps) {
    const chartData = React.useMemo(() => data.map(d => ({
        ...d,
        volumeValue: Number(d.volume) / 100,
        dateShort: d.date.split('-').slice(1).join('/')
    })), [data]);

    return (
        <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden flex flex-col h-[380px] group relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none transition-opacity duration-700 opacity-50 group-hover:opacity-100" />

            <CardHeader className="p-5 md:p-6 pb-0 flex flex-row items-start justify-between relative z-10">
                <div className="space-y-1">
                    <CardTitle className="text-base font-black text-foreground flex items-center gap-2 tracking-tight">
                        <div className="h-8 w-8 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        {title}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground font-bold tracking-widest pl-10 uppercase opacity-70">{subtitle}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-[10px] font-black tracking-widest uppercase bg-muted/30 px-3 py-1.5 rounded-3xl border border-border/40 shadow-inner">
                    <div className="flex items-center gap-1.5 text-primary">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" /> Volume
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-500">
                        <div className="w-3 h-1 rounded-sm bg-blue-500/40" /> Transactions
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 relative z-10 mt-4">
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                            <defs>
                                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
                                </linearGradient>
                            </defs>

                            {/* Minimalist dashed grid */}
                            <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />

                            <XAxis
                                dataKey="dateShort"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                                dy={15}
                                minTickGap={30}
                            />

                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                                tickFormatter={(val) => `₦${(val / 1000).toFixed(0)}k`}
                                dx={-10}
                            />

                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                                dx={10}
                            />

                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.2 }}
                                isAnimationActive={false}
                            />

                            {/* Ghost bars for frequency */}
                            <Bar
                                yAxisId="right"
                                dataKey="donations"
                                barSize={8}
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                opacity={0.15}
                                animationDuration={1200}
                                animationEasing="ease-out"
                            />

                            {/* Crisp, fluid primary line */}
                            <Line
                                yAxisId="left"
                                type="natural"
                                dataKey="volumeValue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))', style: { filter: 'drop-shadow(0px 4px 8px rgba(16, 185, 129, 0.4))' } }}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            />

                            {/* Subtle gradient fill below the line */}
                            <Area
                                yAxisId="left"
                                type="natural"
                                dataKey="volumeValue"
                                stroke="none"
                                fill="url(#volumeGradient)"
                                activeDot={false}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
});