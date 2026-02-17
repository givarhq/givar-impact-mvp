'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FileSearch } from 'lucide-react';

interface EvidenceStatusProps {
    metrics: {
        totalSubmitted: number;
        statusDistribution: Array<{ status: string; count: number }>;
    };
}

const COLORS = {
    APPROVED: 'hsl(var(--primary))',
    PENDING: '#f59e0b',
    REJECTED: 'hsl(var(--destructive))',
};

export function EvidenceStatusChart({ metrics }: EvidenceStatusProps) {
    const data = metrics.statusDistribution.map(item => ({
        name: item.status,
        value: item.count
    }));

    const activeData = data.filter(d => d.value > 0);

    return (
        <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden h-[380px] flex flex-col">
            <CardHeader className="p-5 md:p-6 pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileSearch className="h-4 w-4 text-primary" /> Evidence audit
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
                    <p className="text-2xl font-bold text-foreground leading-none">{metrics.totalSubmitted}</p>
                    <p className="text-[11px] font-bold text-muted-foreground  tracking-widest mt-1">Total proofs</p>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={activeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                        >
                            {activeData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            isAnimationActive={false}
                            contentStyle={{
                                borderRadius: '16px',
                                border: '1px solid hsl(var(--border)/0.6)',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                                background: 'hsl(var(--card))',
                                padding: '8px 12px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute bottom-6 w-full px-6 flex justify-center gap-4 text-[11px] font-bold  tracking-wider text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Verified
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-destructive" /> Rejected
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}