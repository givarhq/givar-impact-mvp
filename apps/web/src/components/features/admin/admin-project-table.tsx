'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Inbox,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Calendar,
    Target,
    TrendingUp
} from 'lucide-react';
import { SmartCurrency } from '../../ui/smart-currency';
import { Badge } from '../../ui/badge';
import { AdminProjectActions } from './project-actions';
import { formatDate, formatCurrency } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Project } from '../../../types';

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

    // Centralized Sorting Handler
    const handleSort = (column: string) => {
        const params = new URLSearchParams(searchParams.toString());

        // Toggle logic: if clicking same column, flip order. If new column, default to desc.
        const newOrder = (currentSort === column && currentOrder === 'desc') ? 'asc' : 'desc';

        params.set('sortBy', column);
        params.set('sortOrder', newOrder);
        params.set('page', '1'); // Reset to first page on sort

        router.push(`?${params.toString()}`);
    };

    // Internal Component for Clean Header Logic
    const SortHeader = ({ title, column, className = "" }: { title: string, column: string, className?: string }) => {
        const isActive = currentSort === column;
        return (
            <th
                className={cn(
                    "px-6 py-4 font-bold uppercase tracking-widest text-[10px] cursor-pointer hover:text-primary transition-colors group select-none",
                    className
                )}
                onClick={() => handleSort(column)}
            >
                <div className="flex items-center gap-2">
                    {title}
                    <div className="relative flex items-center justify-center">
                        {isActive ? (
                            currentOrder === 'asc' ?
                                <ArrowUp className="h-3 w-3 text-primary animate-in zoom-in duration-300" /> :
                                <ArrowDown className="h-3 w-3 text-primary animate-in zoom-in duration-300" />
                        ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-all duration-200" />
                        )}
                    </div>
                </div>
            </th>
        );
    };

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden relative">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                        <tr>
                            <SortHeader title="Project Details" column="title" />
                            <SortHeader title="Status" column="status" />
                            <SortHeader title="Launched" column="createdAt" />
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <TrendingUp className="h-3 w-3" /> Financials
                                </div>
                            </th>
                            <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                        {projects.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-24 text-center text-muted-foreground italic">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center border border-border">
                                            <Inbox className="h-6 w-6 opacity-20" />
                                        </div>
                                        <p className="font-medium text-sm">No projects found matching your search</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            projects.map((project) => (
                                <tr
                                    key={project.id}
                                    className="hover:bg-muted/30 transition-all cursor-pointer group/row"
                                    onClick={() => router.push(`/admin/projects/${project.id}/edit`)}
                                >
                                    {/* Project & ID */}
                                    <td className="px-6 py-4">
                                        <div className="space-y-1 min-w-[200px]">
                                            <p className="font-bold text-foreground group-hover/row:text-primary transition-colors line-clamp-1">
                                                {project.title}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-mono uppercase bg-muted/50 px-1.5 py-0.5 rounded-md border border-border/50 text-muted-foreground">
                                                    ID: {project.id.split('-')[0]}
                                                </span>
                                                {project.categoryName && (
                                                    <span className="text-[9px] font-bold text-primary/70 uppercase">
                                                        {project.categoryName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Status Badge */}
                                    <td className="px-6 py-4">
                                        <Badge
                                            variant={project.status === 'ACTIVE' ? 'success' : 'secondary'}
                                            className="uppercase text-[9px] font-black tracking-widest px-2 py-1 rounded-xl shadow-sm"
                                        >
                                            {project.status}
                                        </Badge>
                                    </td>

                                    {/* Launched Date */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs whitespace-nowrap">
                                            <Calendar className="h-3.5 w-3.5 opacity-50" />
                                            {formatDate(project.createdAt).split(',')[0]}
                                        </div>
                                    </td>

                                    {/* Raised / Target */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end gap-1 min-w-[120px]">
                                            <div className="font-bold tabular-nums text-foreground">
                                                <SmartCurrency
                                                    amount={project.raisedAmount}
                                                    currency={project.currency}
                                                    visible={true}
                                                    size="small"
                                                    className="text-sm"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-tighter bg-muted/30 px-1.5 py-0.5 rounded-md border border-border/50">
                                                <Target className="h-2.5 w-2.5" />
                                                {formatCurrency(project.targetAmount, project.currency)}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Action Column - Propagation Stopped */}
                                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end opacity-60 group-hover/row:opacity-100 transition-opacity">
                                            <AdminProjectActions id={project.id} status={project.status} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}