'use client';

import React, { useState, memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../../ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { SmartCurrency } from '../../../ui/smart-currency';

interface ProjectPerformanceProps {
    topFunded: Array<{ id: string; title: string; raised: string; percent: number }>;
    mostActive: Array<{ id: string; title: string; donationCount: number }>;
}

const CustomTooltip = ({ active, payload, mode }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border/60 p-3 rounded-2xl shadow-xl min-w-[180px] animate-in fade-in zoom-in-95 duration-100">
                <p className="text-[11px] font-bold tracking-wider text-muted-foreground mb-1.5">
                    {mode === 'funded' ? 'Capital raised' : 'Donation volume'}
                </p>
                <p className="text-xs font-bold text-foreground mb-2 line-clamp-2 leading-tight">
                    {payload[0].payload.title}
                </p>
                <div className="flex items-baseline gap-2">
                    {mode === 'funded' ? (
                        <SmartCurrency
                            amount={payload[0].value}
                            currency="NGN"
                            visible={true}
                            className="text-base text-primary font-bold"
                        />
                    ) : (
                        <span className="text-base text-blue-500 font-bold">{payload[0].value} gifts</span>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

// Logic: Memoize the performance card to prevent re-calculating bar heights on layout shifts.
export const ProjectPerformanceCard = memo(function ProjectPerformanceCard({ topFunded, mostActive }: ProjectPerformanceProps) {
    const [activeTab, setActiveTab] = useState('funded');
    const fundedData = React.useMemo(() => topFunded.map(p => ({ ...p, value: Number(p.raised) })), [topFunded]);
    const activeData = React.useMemo(() => mostActive.map(p => ({ ...p, value: p.donationCount })), [mostActive]);

    return (
        <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden flex flex-col h-[420px]">
            <CardHeader className="p-5 md:p-6 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" /> Project leaderboard
                    </CardTitle>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="bg-muted/50 p-1 rounded-2xl h-9 w-full sm:w-[220px] border border-border/40">
                        <TabsTrigger value="funded" className="text-[11px] font-bold tracking-wider rounded-xl h-7 flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">Top funded</TabsTrigger>
                        <TabsTrigger value="active" className="text-[11px] font-bold tracking-wider rounded-xl h-7 flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">Most active</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-2 flex-1 min-h-0">
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={activeTab === 'funded' ? fundedData : activeData}
                            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                            barSize={20}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="title"
                                width={110}
                                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                                tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 15)}..` : val}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                content={<CustomTooltip mode={activeTab} />}
                                cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 4 }}
                                isAnimationActive={false}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={600}>
                                {(activeTab === 'funded' ? fundedData : activeData).map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={activeTab === 'funded' ? `hsl(var(--primary) / ${1 - (index * 0.12)})` : `hsl(217, 91%, 60%, ${1 - (index * 0.12)})`}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
});