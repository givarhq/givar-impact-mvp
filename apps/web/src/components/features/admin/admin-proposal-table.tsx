'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Eye, Clock, User, DollarSign,
    ArrowUp, ArrowDown, ArrowUpDown, Inbox,
    AlertCircle, Calendar
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { SmartCurrency } from '../../ui/smart-currency';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';

const statusStyles: Record<string, string> = {
    SUBMITTED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    UNDER_REVIEW: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    CHANGES_REQUESTED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    REJECTED: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function AdminProposalTable({ proposals }: { proposals: any[] }) {
    const router = useRouter();

    if (proposals.length === 0) {
        return (
            <div className="py-24 text-center border-2 border-dashed border-border rounded-[32px] bg-muted/10">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-foreground opacity-60 uppercase tracking-widest">Pipeline Empty</h3>
                <p className="text-sm text-muted-foreground mt-1">Adjust filters or check back later.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                        <tr>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Proposal Details</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Proposer</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Requested</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Status</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Submitted</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {proposals.map((p) => (
                            <tr
                                key={p.id}
                                className="hover:bg-muted/30 transition-all cursor-pointer group/row"
                                onClick={() => router.push(`/admin/proposals/${p.id}`)}
                            >
                                <td className="px-6 py-5">
                                    <div className="space-y-1">
                                        <p className="font-bold text-foreground group-hover/row:text-primary transition-colors line-clamp-1">
                                            {p.title || 'Untitled Proposal'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-mono uppercase bg-muted/50 px-1.5 py-0.5 rounded-md border border-border/50 text-muted-foreground">
                                                ID: {p.id.split('-')[0]}
                                            </span>
                                            <span className="text-[9px] font-bold text-primary/70 uppercase">
                                                {p.category?.name}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                            {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-foreground truncate">{p.user?.firstName} {p.user?.lastName}</p>
                                            <p className="text-[9px] text-muted-foreground truncate">{p.user?.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="font-bold text-foreground tabular-nums">
                                        <SmartCurrency amount={p.targetAmount} currency={p.currency} visible={true} size="small" />
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border", statusStyles[p.status] || 'bg-muted')}>
                                        {p.status.replace('_', ' ')}
                                    </Badge>
                                </td>
                                <td className="px-6 py-5 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5 text-muted-foreground font-medium text-xs">
                                        <Calendar className="h-3 w-3 opacity-50" />
                                        {formatDate(p.submittedAt).split(',')[0]}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}