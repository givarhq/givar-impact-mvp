'use client';

import React from 'react';
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

export function SystemIntelFeed({ report }: { report: any }) {
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
            type: report.summary.unresolvedSuspenseCount > 0 ? 'RISK' : 'ACTION',
            title: 'Ledger Integrity',
            desc: report.summary.unresolvedSuspenseCount > 0
                ? `There are ${report.summary.unresolvedSuspenseCount} orphaned transactions in suspense.`
                : 'Ledger is in sync. Perform manual verify check?',
            target: '/admin/ledger'
        },
        {
            id: '3',
            type: 'ACTION',
            title: 'Proposal Pipeline',
            desc: `${report.proposalMetrics.totalSubmitted} new causes require technical review.`,
            target: '/admin/projects?tab=proposals'
        }
    ];

    return (
        <Card className="col-span-1 lg:col-span-6 rounded-[32px] border-border/50 bg-card shadow-xl shadow-primary/5 overflow-hidden flex flex-col h-[420px]">
            <CardHeader className="p-6 pb-2 border-b border-border/30">
                <CardTitle className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" /> Platform Intelligence
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto no-scrollbar">
                <div className="divide-y divide-border/50">
                    {insights.map((item) => (
                        <div
                            key={item.id}
                            className="p-6 hover:bg-muted/30 transition-colors cursor-pointer group"
                            onClick={() => router.push(item.target)}
                        >
                            <div className="flex items-start gap-5">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm",
                                    item.type === 'RISK' ? "bg-destructive/10 text-destructive border-destructive/20" :
                                        item.type === 'ACTION' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                            "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                )}>
                                    {item.type === 'RISK' ? <AlertCircle className="h-5 w-5" /> :
                                        item.type === 'ACTION' ? <ClipboardList className="h-5 w-5" /> :
                                            <ShieldCheck className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black text-foreground">{item.title}</h4>
                                        <span className="text-[12px] font-bold text-primary opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
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
            <div className="p-4 bg-muted/20 border-t border-border/50">
                <p className="text-[9px] font-bold text-center text-muted-foreground uppercase tracking-[0.2em]">
                    Scanned {new Date().toLocaleTimeString()} • Givar Consensus
                </p>
            </div>
        </Card>
    );
}