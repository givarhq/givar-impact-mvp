'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    Inbox,
    Calendar,
    User,
    ChevronRight
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { SmartCurrency } from '../../ui/smart-currency';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Card, CardContent } from '../../ui/card';

const statusStyles: Record<string, string> = {
    SUBMITTED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    UNDER_REVIEW: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    CHANGES_REQUESTED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    REJECTED: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function AdminProposalTable({ proposals }: { proposals: any[] }) {
    const router = useRouter();

    if (proposals.length === 0) {
        return (
            <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-bold text-foreground opacity-60 uppercase tracking-widest">Pipeline empty</h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">No proposals currently match your criteria.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden">
            {/* MOBILE: High-Density Card List */}
            <div className="grid gap-2 md:hidden">
                {proposals.map((p) => (
                    <Card
                        key={p.id}
                        className="rounded-3xl border-border/40 shadow-sm active:scale-[0.99] transition-all cursor-pointer overflow-hidden"
                        onClick={() => router.push(`/admin/proposals/${p.id}`)}
                    >
                        <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between items-start gap-4 w-full">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-foreground truncate leading-tight">
                                        {p.title || 'Untitled Proposal'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[11px] font-mono bg-muted/60 px-1.5 py-0.5 rounded-3xl border border-border/40 text-muted-foreground">
                                            id: {p.id.split('-')[0]}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={cn("text-[10px] px-2 py-0 rounded-3xl font-bold uppercase tracking-tight border", statusStyles[p.status] || 'bg-muted')}
                                        >
                                            {p.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="shrink-0 pt-1">
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-t border-border/40 pt-3 gap-4">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="h-7 w-7 rounded-3xl bg-secondary flex items-center justify-center text-[11px] font-black text-muted-foreground shrink-0 border border-border/40">
                                        {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate">{p.user?.firstName} {p.user?.lastName}</p>
                                        <p className="text-[11px] text-muted-foreground truncate">{p.user?.email}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-sm font-bold tabular-nums text-foreground">
                                        <SmartCurrency amount={p.targetAmount} currency={p.currency} visible={true} size="small" />
                                    </div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">
                                        {formatDate(p.submittedAt).split(',')[0]}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* DESKTOP: Standard Refined Table */}
            <Card className="hidden md:block rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground">
                            <tr>
                                <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs">Proposal details</th>
                                <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs">Proposer</th>
                                <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs">Requested</th>
                                <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs">Status</th>
                                <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-right">Submitted</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {proposals.map((p) => (
                                <tr
                                    key={p.id}
                                    className="hover:bg-muted/30 transition-all cursor-pointer group"
                                    onClick={() => router.push(`/admin/proposals/${p.id}`)}
                                >
                                    <td className="px-5 py-4">
                                        <div className="min-w-[200px]">
                                            <p className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-sm">
                                                {p.title || 'Untitled Proposal'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] font-mono uppercase bg-muted/50 px-1.5 py-0.5 rounded-3xl border border-border/40 text-muted-foreground">
                                                    id: {p.id.split('-')[0]}
                                                </span>
                                                <span className="text-[11px] font-bold text-primary/70 uppercase tracking-tight">
                                                    {p.category?.name}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-3xl bg-secondary flex items-center justify-center text-[11px] font-black text-muted-foreground border border-border/40 shrink-0">
                                                {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate">{p.user?.firstName} {p.user?.lastName}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">{p.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="font-bold text-foreground tabular-nums">
                                            <SmartCurrency amount={p.targetAmount} currency={p.currency} visible={true} size="small" />
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <Badge
                                            variant="outline"
                                            className={cn("text-[11px] font-bold uppercase tracking-tight px-2 py-0 rounded-3xl border", statusStyles[p.status] || 'bg-muted')}
                                        >
                                            {p.status.replace('_', ' ')}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1.5 text-muted-foreground font-medium text-xs">
                                            <Calendar className="h-3.5 w-3.5 opacity-40" />
                                            {formatDate(p.submittedAt).split(',')[0]}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <Button variant="ghost" size="sm" className="h-8 rounded-3xl text-xs font-bold px-3">
                                            Review
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}