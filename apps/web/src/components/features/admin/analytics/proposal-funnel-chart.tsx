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

export function ProposalFunnelChart({ funnel, totalDrafts, approvalRate }: ProposalFunnelProps) {
    return (
        <Card className="col-span-1 lg:col-span-6 rounded-[32px] border-border/50 bg-card shadow-xl shadow-primary/5 overflow-hidden flex flex-col h-[420px]">
            <CardHeader className="p-6 pb-2 border-b border-border/30">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-blue-500" /> Intake Pipeline
                    </CardTitle>
                    <div className="text-right">
                        <p className="text-2xl font-black text-foreground">{approvalRate}%</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Conversion Rate</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={funnel}
                        margin={{ top: 40, right: 30, left: 20, bottom: 20 }}
                    >
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis
                            dataKey="stage"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', background: 'hsl(var(--card))' }}
                            cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#3b82f6"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>

                {/* Overlay Stats */}
                <div className="absolute top-6 left-8 flex gap-8">
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Inflow</p>
                        <p className="text-lg font-bold text-foreground">{totalDrafts}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Retention</p>
                        <p className="text-lg font-bold text-foreground">{funnel[funnel.length - 1]?.count || 0}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}