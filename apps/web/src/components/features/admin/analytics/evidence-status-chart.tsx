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
    APPROVED: '#10b981',
    PENDING: '#f59e0b',
    REJECTED: '#ef4444',
};

export function EvidenceStatusChart({ metrics }: EvidenceStatusProps) {
    const data = metrics.statusDistribution.map(item => ({
        name: item.status,
        value: item.count
    }));

    const activeData = data.filter(d => d.value > 0);

    return (
        <Card className="col-span-1 lg:col-span-4 rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden h-[380px] flex flex-col">
            <CardHeader className="p-6 pb-2">
                <CardTitle className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <FileSearch className="h-4 w-4 text-purple-500" /> Evidence Audit
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-3xl font-black text-foreground">{metrics.totalSubmitted}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total Proofs</p>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={activeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={105}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={6}
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
                                borderRadius: '12px',
                                border: '1px solid hsl(var(--border))',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                background: 'hsl(var(--card))',
                                padding: '8px 12px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute bottom-6 w-full px-8 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Verified</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Pending</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Rejected</div>
                </div>
            </CardContent>
        </Card>
    );
}