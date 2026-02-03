'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { SmartCurrency } from '../../../ui/smart-currency';

interface ProjectPerformanceProps {
    topFunded: Array<{ id: string; title: string; raised: string; percent: number }>;
    mostActive: Array<{ id: string; title: string; donationCount: number }>;
}

const CustomTooltip = ({ active, payload, label, mode }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card/95 backdrop-blur-xl border border-border/50 p-4 rounded-2xl shadow-xl shadow-black/5 min-w-[200px]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    {mode === 'funded' ? 'Capital Raised' : 'Transaction Volume'}
                </p>
                <p className="text-sm font-bold text-foreground mb-2 line-clamp-2 leading-tight">
                    {payload[0].payload.title}
                </p>
                <div className="flex items-baseline gap-2">
                    {mode === 'funded' ? (
                        <SmartCurrency
                            amount={payload[0].value}
                            currency="NGN"
                            visible={true}
                            className="text-lg text-emerald-500 font-black"
                        />
                    ) : (
                        <span className="text-lg text-blue-500 font-black">{payload[0].value} Donations</span>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export function ProjectPerformanceCard({ topFunded, mostActive }: ProjectPerformanceProps) {
    const [activeTab, setActiveTab] = useState('funded');

    // Transform data for Recharts
    const fundedData = topFunded.map(p => ({ ...p, value: Number(p.raised) }));
    const activeData = mostActive.map(p => ({ ...p, value: p.donationCount }));

    return (
        <Card className="col-span-1 lg:col-span-6 rounded-[32px] border-border/50 bg-card shadow-xl shadow-primary/5 overflow-hidden flex flex-col h-[420px]">
            <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" /> Project Leaderboard
                    </CardTitle>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                    <TabsList className="bg-muted/50 p-1 rounded-xl h-9">
                        <TabsTrigger value="funded" className="text-[10px] font-bold uppercase tracking-wider rounded-lg h-7 px-3">Top Funded</TabsTrigger>
                        <TabsTrigger value="active" className="text-[10px] font-bold uppercase tracking-wider rounded-lg h-7 px-3">Most Active</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent className="p-6 pt-4 flex-1 min-h-0">
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={activeTab === 'funded' ? fundedData : activeData}
                            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                            barSize={32}
                        >
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="title"
                                width={120}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                                tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 15)}...` : val}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip mode={activeTab} />} cursor={{ fill: 'hsl(var(--muted)/0.4)', radius: 8 }} />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                {(activeTab === 'funded' ? fundedData : activeData).map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={activeTab === 'funded' ? `hsl(var(--primary) / ${1 - (index * 0.15)})` : `hsl(217, 91%, 60%, ${1 - (index * 0.15)})`}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}