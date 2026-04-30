'use client';

import React, { memo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import { Zap, ShieldCheck, AlertCircle, ArrowRight, ClipboardList } from 'lucide-react';
import { cn } from '../../../../lib/utils/cn';

interface IntelItem {
    id: string;
    type: 'RISK' | 'ACTION' | 'SUCCESS';
    title: string;
    desc: string;
    target: string;
}

export const SystemIntelFeed = memo(function SystemIntelFeed({ report }: { report: any }) {
    const router = useRouter();

    const insights: IntelItem[] = [
        {
            id: '1',
            type: report.summary.pendingKycCount > 0 ? 'RISK' : 'SUCCESS',
            title: 'Organization Verification',
            desc: report.summary.pendingKycCount > 0
                ? `${report.summary.pendingKycCount} entities are waiting for legal vetting.`
                : 'All registered entities are fully verified.',
            target: '/admin/verifications?tab=orgs'
        },
        {
            id: '2',
            type: 'ACTION',
            title: 'Proposal Pipeline',
            desc: `${report.proposalMetrics.totalSubmitted} new causes require technical review.`,
            target: '/admin/projects?tab=proposals'
        },
        {
            id: '3',
            type: report.evidenceMetrics.pending > 0 ? 'RISK' : 'SUCCESS',
            title: 'Execution Evidence',
            desc: report.evidenceMetrics.pending > 0
                ? `${report.evidenceMetrics.pending} proof documents are pending audit.`
                : 'All uploaded impact evidence has been verified.',
            target: '/admin/verifications?tab=evidence'
        }
    ];

    return (
        <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden flex flex-col h-[420px]">
            <CardHeader className="p-5 md:p-6 pb-2 border-b border-border/40">
                <CardTitle className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-primary" /> Platform Intelligence
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto no-scrollbar">
                <div className="divide-y divide-border/40">
                    {insights.map((item) => (
                        <div
                            key={item.id}
                            className="p-5 md:p-6 hover:bg-muted/30 transition-colors cursor-pointer group"
                            onClick={() => router.push(item.target)}
                        >
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner transition-colors",
                                    item.type === 'RISK' ? "bg-destructive/10 text-destructive border-destructive/10" :
                                        item.type === 'ACTION' ? "bg-blue-500/10 text-blue-600 border-blue-500/10" :
                                            "bg-emerald-500/10 text-emerald-600 border-emerald-500/10"
                                )}>
                                    {item.type === 'RISK' ? <AlertCircle className="h-5 w-5" /> :
                                        item.type === 'ACTION' ? <ClipboardList className="h-5 w-5" /> :
                                            <ShieldCheck className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</h4>
                                        <span className="text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                                            Resolve <ArrowRight className="h-3 w-3" />
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            <div className="p-4 bg-muted/20 border-t border-border/40 text-center">
                <p className="text-[10px] font-bold text-muted-foreground tracking-widest flex items-center justify-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Last Scan {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </Card>
    );
});