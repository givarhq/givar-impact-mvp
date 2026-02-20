'use client';

import React, { useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Inbox,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { SmartCurrency } from '../../ui/smart-currency';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Card, CardContent } from '../../ui/card';
import { motion, AnimatePresence } from 'framer-motion';

const statusStyles: Record<string, string> = {
    SUBMITTED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    UNDER_REVIEW: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    CHANGES_REQUESTED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    REJECTED: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface AdminProposalTableProps {
    proposals: any[];
    selectedIds: string[];
    onSelectRow: (id: string, checked: boolean) => void;
    onSelectAll: (checked: boolean) => void;
}

export const AdminProposalTable = memo(function AdminProposalTable({
    proposals,
    selectedIds,
    onSelectRow,
    onSelectAll
}: AdminProposalTableProps) {
    const router = useRouter();
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const isAllSelected = proposals.length > 0 && selectedIds.length === proposals.length;
    const isSelectionMode = selectedIds.length > 0;

    const startLongPress = (id: string) => {
        longPressTimer.current = setTimeout(() => {
            onSelectRow(id, true);
            window.navigator.vibrate?.(50);
        }, 500);
    };

    const clearLongPress = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    if (proposals.length === 0) {
        return (
            <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-semibold text-foreground opacity-60 tracking-widest">Pipeline empty</h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">No proposals currently match your criteria.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden">
            <div className="grid gap-2 md:hidden">
                <div className={cn(
                    "flex items-center gap-2 px-2 mb-1 transition-opacity duration-200",
                    isSelectionMode ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded-3xl border-border/40 text-primary focus:ring-primary/20"
                        checked={isAllSelected}
                        onChange={(e) => onSelectAll(e.target.checked)}
                    />
                    <span className="text-xs font-semibold text-muted-foreground tracking-widest">Select all</span>
                </div>
                <AnimatePresence mode="popLayout">
                    {proposals.map((p) => {
                        const isSelected = selectedIds.includes(p.id);
                        return (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <Card
                                    className={cn(
                                        "rounded-3xl border shadow-sm transition-all cursor-pointer overflow-hidden md:overflow-visible",
                                        "touch-pan-y select-none",
                                        isSelected ? "border-primary bg-primary/[0.02]" : "border-border/40 bg-card"
                                    )}
                                    onPointerDown={() => startLongPress(p.id)}
                                    onPointerUp={clearLongPress}
                                    onPointerLeave={clearLongPress}
                                    onClick={() => {
                                        if (isSelectionMode) onSelectRow(p.id, !isSelected);
                                        else router.push(`/admin/proposals/${p.id}`);
                                    }}
                                >
                                    <CardContent className="p-4 space-y-4 select-none">
                                        <div className="flex justify-between items-start gap-4 w-full">
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <div className={cn(
                                                    "transition-all duration-200 overflow-visible",
                                                    isSelectionMode ? "w-4 opacity-100" : "w-0 opacity-0"
                                                )}>
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded-3xl border-border/40 text-primary mt-1"
                                                        checked={isSelected}
                                                        onChange={(e) => onSelectRow(p.id, e.target.checked)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate leading-tight">
                                                        {p.title || 'Untitled Proposal'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="text-[11px] font-mono bg-muted/60 px-1.5 py-0.5 rounded-3xl border border-border/40 text-muted-foreground">
                                                            id: {p.id.split('-')[0]}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn("text-[10px] px-2 py-0 rounded-3xl font-semibold tracking-tight border", statusStyles[p.status] || 'bg-muted')}
                                                        >
                                                            {p.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
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
                                                    <p className="text-xs font-semibold text-foreground truncate">{p.user?.firstName} {p.user?.lastName}</p>
                                                    <p className="text-[11px] text-muted-foreground truncate">{p.user?.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-sm font-semibold tabular-nums text-foreground">
                                                    <SmartCurrency amount={p.targetAmount} currency={p.currency} visible={true} size="small" />
                                                </div>
                                                <p className="text-[10px] font-semibold text-muted-foreground tracking-tighter mt-0.5">
                                                    {formatDate(p.submittedAt).split(',')[0]}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <Card className="hidden md:block rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground group">
                            <tr>
                                <th className="px-5 py-3 w-[50px]">
                                    <div className={cn(
                                        "transition-opacity duration-200",
                                        (isAllSelected || isSelectionMode) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    )}>
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded-3xl border-border/40 text-primary focus:ring-primary/20"
                                            checked={isAllSelected}
                                            onChange={(e) => onSelectAll(e.target.checked)}
                                        />
                                    </div>
                                </th>
                                <th className="px-5 py-3 font-semibold tracking-wider text-xs">Proposal details</th>
                                <th className="px-5 py-3 font-semibold tracking-wider text-xs">Proposer</th>
                                <th className="px-5 py-3 font-semibold tracking-wider text-xs">Requested</th>
                                <th className="px-5 py-3 font-semibold tracking-wider text-xs">Status</th>
                                <th className="px-5 py-3 font-semibold tracking-wider text-xs text-right">Submitted</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {proposals.map((p) => {
                                const isSelected = selectedIds.includes(p.id);
                                return (
                                    <tr
                                        key={p.id}
                                        className={cn(
                                            "hover:bg-muted/30 transition-all cursor-pointer group",
                                            isSelected ? "bg-primary/[0.01]" : ""
                                        )}
                                        onClick={() => router.push(`/admin/proposals/${p.id}`)}
                                    >
                                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className={cn(
                                                "transition-opacity duration-200",
                                                isSelected || isSelectionMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                            )}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded-3xl border-border/40 text-primary focus:ring-primary/20"
                                                    checked={isSelected}
                                                    onChange={(e) => onSelectRow(p.id, e.target.checked)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="min-w-[200px]">
                                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-sm">
                                                    {p.title || 'Untitled Proposal'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[11px] font-mono bg-muted/50 px-1.5 py-0.5 rounded-3xl border border-border/40 text-muted-foreground">
                                                        id: {p.id.split('-')[0]}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-primary/70 tracking-tight">
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
                                                    <p className="text-xs font-semibold text-foreground truncate">{p.user?.firstName} {p.user?.lastName}</p>
                                                    <p className="text-[11px] text-muted-foreground truncate">{p.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-foreground tabular-nums">
                                                <SmartCurrency amount={p.targetAmount} currency={p.currency} visible={true} size="small" />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge
                                                variant="outline"
                                                className={cn("text-[11px] font-semibold tracking-tight px-2 py-0 rounded-3xl border shadow-none", statusStyles[p.status] || 'bg-muted')}
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
                                            <Button variant="ghost" size="sm" className="h-8 rounded-3xl text-xs font-semibold px-3">
                                                Review
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
});