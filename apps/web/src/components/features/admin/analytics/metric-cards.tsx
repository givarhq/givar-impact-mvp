'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Zap, Users2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';

export function SectorAllocationCard({ data }: { data: Array<{ category: string; count: number; volume: string }> }) {
    // Sort by count descending
    const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 5);

    return (
        <Card className="col-span-1 lg:col-span-4 rounded-[32px] border-border/50 bg-card shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden h-[380px] flex flex-col">
            <CardHeader className="p-6 pb-2">
                <CardTitle className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Sector Allocation
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-4 flex-1">
                <div className="space-y-5">
                    {sortedData.map((cat, i) => (
                        <div key={i} className="space-y-1.5 group">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-foreground group-hover:text-primary transition-colors">{cat.category}</span>
                                <span className="text-muted-foreground font-mono">{cat.count}</span>
                            </div>
                            <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000 group-hover:shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                                    style={{ width: `${Math.min(100, (cat.count / Math.max(...data.map(d => d.count))) * 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function EntityCompositionCard({ data }: { data: Array<{ type: string; count: number }> }) {
    return (
        <Card className="col-span-1 lg:col-span-4 rounded-[32px] border-border/50 bg-card shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden h-[380px] flex flex-col">
            <CardHeader className="p-6 pb-2">
                <CardTitle className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-blue-500" /> Account Demographics
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-4 flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 8 }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)', background: 'hsl(var(--card))', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <XAxis
                            dataKey="type"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }}
                            dy={10}
                        />
                        <Bar dataKey="count" radius={[12, 12, 12, 12]} barSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#a855f7'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}