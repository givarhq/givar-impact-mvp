'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Building2 } from 'lucide-react';

interface OrganizationHealthProps {
    metrics: {
        totalEntities: number;
        verifiedCount: number;
        pendingCount: number;
        activeOrganizers: number;
    };
}

export function OrganizationHealthCard({ metrics }: OrganizationHealthProps) {
    // Calculate percentages for Radial Bars
    const verifiedPercent = metrics.totalEntities > 0 ? (metrics.verifiedCount / metrics.totalEntities) * 100 : 0;
    const activePercent = metrics.totalEntities > 0 ? (metrics.activeOrganizers / metrics.totalEntities) * 100 : 0;

    const data = [
        { name: 'Verified', value: verifiedPercent, fill: '#10b981' },
        { name: 'Active', value: activePercent, fill: '#3b82f6' }
    ];

    return (
        <Card className="col-span-1 lg:col-span-4 rounded-[32px] border-border/50 bg-card shadow-xl shadow-primary/5 overflow-hidden h-[380px] flex flex-col">
            <CardHeader className="p-6 pb-2">
                <CardTitle className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-500" /> Partner Health
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative flex flex-col items-center justify-center">

                <div className="h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="70%"
                            outerRadius="100%"
                            barSize={12}
                            data={data}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar background dataKey="value" cornerRadius={10} />
                        </RadialBarChart>
                    </ResponsiveContainer>

                    {/* Center Stat */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <p className="text-3xl font-black text-foreground">{metrics.totalEntities}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Entities</p>
                    </div>
                </div>

                <div className="w-full px-8 pb-8 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Verified</span>
                        </div>
                        <span className="text-sm font-black text-foreground">{metrics.verifiedCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Projects</span>
                        </div>
                        <span className="text-sm font-black text-foreground">{metrics.activeOrganizers}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-60">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending</span>
                        </div>
                        <span className="text-sm font-black text-foreground">{metrics.pendingCount}</span>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}