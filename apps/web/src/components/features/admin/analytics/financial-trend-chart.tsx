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
    Area,
    Bar
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../../../lib/utils/format';

interface FinancialTrendChartProps {
    data: Array<{ date: string; volume: string; donations: number }>;
    title: string;
    subtitle: string;
}

const formatCompactNGN = (value: number) => {
    const abs = Math.abs(value);

    if (abs >= 1_000_000_000) {
        return `₦${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    }

    if (abs >= 1_000_000) {
        return `₦${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }

    if (abs >= 1_000) {
        return `₦${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    }

    return `₦${value}`;
};

const PremiumTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const volume = payload.find((p: any) => p.dataKey === 'volumeValue')?.value || 0;
    const count = payload.find((p: any) => p.dataKey === 'donations')?.value || 0;

    return (
        <div className="bg-background border border-border shadow-2xl px-4 py-3 rounded-xl min-w-[190px]">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 text-left">
                {label}
            </p>

            <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Liquidity</span>
                    <span className="font-semibold tabular-nums text-foreground">
                        {formatCompactNGN(volume * 100)}
                    </span>
                </div>

                <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Frequency</span>
                    <span className="font-semibold tabular-nums text-foreground">
                        {count}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const FinancialTrendChart = memo(function FinancialTrendChart({
    data,
    title,
    subtitle
}: FinancialTrendChartProps) {

    const chartData = React.useMemo(
        () =>
            data.map(d => ({
                ...d,
                volumeValue: Number(d.volume) / 100,
                dateShort: d.date.split('-').slice(1).join('/')
            })),
        [data]
    );

    return (
        <Card className="rounded-3xl border border-border bg-background shadow-sm flex flex-col h-[380px]">
            <CardHeader className="px-7 pt-7 pb-4 flex items-start justify-between">
                <div className="space-y-1 text-left">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        {title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        {subtitle}
                    </p>
                </div>

                <div className="hidden sm:flex items-center gap-6 text-[11px] font-medium text-left">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-6 bg-primary rounded-sm" />
                        Liquidity
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-6 bg-muted-foreground/50 rounded-sm" />
                        Frequency
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 px-1 sm:px-6 pb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid
                            stroke="hsl(var(--border))"
                            vertical
                            horizontal
                            strokeOpacity={0.25}
                        />

                        <XAxis
                            dataKey="dateShort"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 10,
                                fill: 'hsl(var(--muted-foreground))',
                                fontWeight: 600
                            }}
                        />

                        <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 10,
                                fill: 'hsl(var(--muted-foreground))',
                                fontWeight: 600
                            }}
                            tickFormatter={formatCompactNGN}
                        />

                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 10,
                                fill: 'hsl(var(--muted-foreground))',
                                fontWeight: 600
                            }}
                        />

                        <Tooltip
                            content={<PremiumTooltip />}
                            cursor={{
                                stroke: 'hsl(var(--primary))',
                                strokeWidth: 1,
                                strokeOpacity: 0.3
                            }}
                        />

                        <Bar
                            yAxisId="right"
                            dataKey="donations"
                            barSize={12}
                            fill="hsl(var(--muted-foreground))"
                            opacity={0.35}
                            radius={[4, 4, 0, 0]}
                            animationDuration={600}
                        />

                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="volumeValue"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="transparent"
                            dot={false}
                            activeDot={{
                                r: 4,
                                strokeWidth: 0,
                                fill: 'hsl(var(--primary))'
                            }}
                            animationDuration={900}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
});