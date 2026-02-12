'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Inbox,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Calendar,
    TrendingUp,
    Flag
} from 'lucide-react';
import { SmartCurrency } from '../../ui/smart-currency';
import { Badge } from '../../ui/badge';
import { AdminProjectActions } from './project-actions';
import { formatDate, formatCurrency } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Project } from '../../../types';
import { Card, CardContent } from '../../ui/card';

interface AdminProjectTableProps {
    projects: Project[];
    currentSort: string;
    currentOrder: string;
}

export function AdminProjectTable({
    projects,
    currentSort,
    currentOrder
}: AdminProjectTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSort = (column: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const newOrder = (currentSort === column && currentOrder === 'desc') ? 'asc' : 'desc';
        params.set('sortBy', column);
        params.set('sortOrder', newOrder);
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const SortHeader = ({ title, column, className = "" }: { title: string, column: string, className?: string }) => {
        const isActive = currentSort === column;
        return (
            <th
                className={cn(
                    "px-5 py-3 font-bold uppercase tracking-wider text-xs cursor-pointer hover:text-primary transition-colors group select-none",
                    className
                )}
                onClick={() => handleSort(column)}
            >
                <div className="flex items-center gap-2">
                    {title}
                    <div className="relative flex items-center justify-center">
                        {isActive ? (
                            currentOrder === 'asc' ?
                                <ArrowUp className="h-3 w-3 text-primary animate-in zoom-in" /> :
                                <ArrowDown className="h-3 w-3 text-primary animate-in zoom-in" />
                        ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                        )}
                    </div>
                </div>
            </th>
        );
    };

    if (projects.length === 0) {
        return (
            <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-bold text-foreground opacity-60 uppercase tracking-widest">No projects identified</h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Try adjusting your active filters.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-hidden">
            {/* MOBILE: High-Density Card List */}
            <div className="grid gap-2 md:hidden">
                {projects.map((project) => (
                    <Card
                        key={project.id}
                        className="rounded-3xl border-border/40 shadow-sm active:scale-[0.99] transition-all cursor-pointer overflow-hidden"
                        onClick={() => router.push(`/admin/projects/${project.id}/edit`)}
                    >
                        <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between items-start gap-4 w-full">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-foreground truncate leading-tight">{project.title}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[11px] font-mono bg-muted/60 px-1.5 py-0.5 rounded-3xl border border-border/40 text-muted-foreground">
                                            id: {project.id.split('-')[0]}
                                        </span>
                                        <Badge variant="outline" className="text-[9px] px-2 py-0 rounded-3xl font-bold uppercase tracking-tight border-primary/20 bg-primary/5 text-primary">
                                            {project.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
                                    <AdminProjectActions id={project.id} status={project.status} />
                                </div>
                            </div>

                            <div className="flex justify-between items-end border-t border-border/40 pt-3 gap-4">
                                <div className="space-y-1 min-w-0">
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Raised / Target</p>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <SmartCurrency amount={project.raisedAmount} currency={project.currency} visible={true} size="small" />
                                        <span className="text-muted-foreground/50 text-[11px]">of</span>
                                        <span className="text-xs font-bold text-muted-foreground">{formatCurrency(project.targetAmount, project.currency)}</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[11px] font-bold text-muted-foreground tabular-nums">{formatDate(project.createdAt).split(',')[0]}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* DESKTOP: Forensic Table */}
            <Card className="hidden md:block rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground">
                            <tr>
                                <SortHeader title="Cause details" column="title" />
                                <SortHeader title="Status" column="status" />
                                <SortHeader title="Launched" column="createdAt" />
                                <th className="px-5 py-3 font-bold uppercase tracking-wider text-xs text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <TrendingUp className="h-3 w-3" /> Financials
                                    </div>
                                </th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {projects.map((project) => (
                                <tr
                                    key={project.id}
                                    className="hover:bg-muted/30 transition-all cursor-pointer group"
                                    onClick={() => router.push(`/admin/projects/${project.id}/edit`)}
                                >
                                    <td className="px-5 py-4">
                                        <div className="min-w-[200px]">
                                            <p className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-sm">
                                                {project.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] font-mono uppercase bg-muted/50 px-1.5 py-0.5 rounded-3xl border border-border/40 text-muted-foreground">
                                                    id: {project.id.split('-')[0]}
                                                </span>
                                                {project.categoryName && (
                                                    <span className="text-[11px] font-bold text-primary/70 uppercase tracking-tight">
                                                        {project.categoryName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <Badge
                                            variant={project.status === 'ACTIVE' ? 'success' : 'outline'}
                                            className="uppercase text-[11px] font-bold px-2 py-0 rounded-3xl"
                                        >
                                            {project.status}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-xs whitespace-nowrap">
                                            <Calendar className="h-3.5 w-3.5 opacity-40" />
                                            {formatDate(project.createdAt).split(',')[0]}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex flex-col items-end gap-0.5">
                                            <div className="font-bold tabular-nums text-foreground">
                                                <SmartCurrency
                                                    amount={project.raisedAmount}
                                                    currency={project.currency}
                                                    visible={true}
                                                    size="small"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-tighter">
                                                <Flag className="h-3 w-3 opacity-50" />
                                                {formatCurrency(project.targetAmount, project.currency)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <AdminProjectActions id={project.id} status={project.status} />
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