'use client';

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { Building2 } from 'lucide-react';
import { cn } from '../../../../lib/utils/cn';

interface OrganizationHealthProps {
    metrics: {
        totalEntities: number;
        verifiedCount: number;
        pendingCount: number;
        activeOrganizers: number;
    };
}

// Logic: Use React.memo to ensure complex radial calculations only happen when metrics update.
export const OrganizationHealthCard = memo(function OrganizationHealthCard({ metrics }: OrganizationHealthProps) {
    const verifiedPercent = metrics.totalEntities > 0 ? (metrics.verifiedCount / metrics.totalEntities) * 100 : 0;
    const activePercent = metrics.totalEntities > 0 ? (metrics.activeOrganizers / metrics.totalEntities) * 100 : 0;

    const data = [
        { name: 'Verified', value: verifiedPercent, fill: 'hsl(var(--primary))' },
        { name: 'Active', value: activePercent, fill: '#3b82f6' }
    ];

    return (
        <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden h-[380px] flex flex-col">
            <CardHeader className="p-5 md:p-6 pb-2">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-500" /> Partner health
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative flex flex-col items-center justify-center">

                <div className="h-44 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="70%"
                            outerRadius="100%"
                            barSize={10}
                            data={data}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar
                                background
                                dataKey="value"
                                cornerRadius={10}
                                animationDuration={1000}
                                animationEasing="ease-out"
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <p className="text-2xl font-bold text-foreground leading-none">{metrics.totalEntities}</p>
                        <p className="text-[11px] font-bold text-muted-foreground tracking-widest mt-1">Entities</p>
                    </div>
                </div>

                <div className="w-full px-8 pb-6 space-y-3 mt-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span className="text-xs font-medium text-muted-foreground">Verified nodes</span>
                        </div>
                        <span className="text-xs font-bold text-foreground tabular-nums">{metrics.verifiedCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span className="text-xs font-medium text-muted-foreground">Active projects</span>
                        </div>
                        <span className="text-xs font-bold text-foreground tabular-nums">{metrics.activeOrganizers}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-50">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Pending review</span>
                        </div>
                        <span className="text-xs font-bold text-foreground tabular-nums">{metrics.pendingCount}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});