'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClipboardList } from 'lucide-react';

interface ProposalFunnelProps {
    funnel: Array<{ stage: string; count: number }>;
    totalDrafts: number;
    approvalRate: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border/60 shadow-xl p-3 rounded-2xl min-w-[140px] animate-in fade-in zoom-in-95 duration-100">
                <p className="text-[11px] font-bold text-muted-foreground mb-1.5  tracking-wider">
                    {label}
                </p>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-blue-500 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Count
                    </span>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                        {payload[0].value}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export function ProposalFunnelChart({ funnel, totalDrafts, approvalRate }: ProposalFunnelProps) {
    return (
        <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden flex flex-col h-[420px]">
            <CardHeader className="p-5 md:p-6 pb-2 border-b border-border/30">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-blue-500" /> Intake pipeline
                    </CardTitle>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-foreground tracking-tight leading-none">{approvalRate}%</p>
                        <p className="text-[11px] font-bold text-muted-foreground  tracking-widest mt-1">Approval rate</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.03] to-transparent pointer-events-none" />

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={funnel}
                        margin={{ top: 40, right: 30, left: 10, bottom: 20 }}
                    >
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis
                            dataKey="stage"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }} isAnimationActive={false} />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            animationDuration={1000}
                        />
                    </AreaChart>
                </ResponsiveContainer>

                <div className="absolute top-6 left-8 flex gap-8">
                    <div>
                        <p className="text-[11px] font-bold text-muted-foreground  tracking-wider">Total inflow</p>
                        <p className="text-lg font-bold text-foreground tabular-nums">{totalDrafts}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-muted-foreground  tracking-wider">Conversion</p>
                        <p className="text-lg font-bold text-foreground tabular-nums">{funnel[funnel.length - 1]?.count || 0}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}