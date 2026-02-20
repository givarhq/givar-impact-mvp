'use client';

import React, { useRef, memo } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';

interface AdminProjectTableProps {
    projects: Project[];
    currentSort: string;
    currentOrder: string;
    selectedIds: string[];
    onSelectRow: (id: string, checked: boolean) => void;
    onSelectAll: (checked: boolean) => void;
}

export const AdminProjectTable = memo(function AdminProjectTable({
    projects,
    currentSort,
    currentOrder,
    selectedIds,
    onSelectRow,
    onSelectAll
}: AdminProjectTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const isAllSelected = projects.length > 0 && selectedIds.length === projects.length;
    const isSelectionMode = selectedIds.length > 0;

    const handleSort = (column: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const newOrder = (currentSort === column && currentOrder === 'desc') ? 'asc' : 'desc';
        params.set('sortBy', column);
        params.set('sortOrder', newOrder);
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const startLongPress = (id: string) => {
        longPressTimer.current = setTimeout(() => {
            onSelectRow(id, true);
            window.navigator.vibrate?.(50);
        }, 500);
    };

    const clearLongPress = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const SortHeader = ({ title, column, className = "" }: { title: string, column: string, className?: string }) => {
        const isActive = currentSort === column;
        return (
            <th
                className={cn(
                    "px-5 py-3 font-semibold tracking-wider text-xs cursor-pointer hover:text-primary transition-colors group select-none",
                    className
                )}
                onClick={() => handleSort(column)}
            >
                <div className="flex items-center gap-2">
                    {title}
                    <div className="relative flex items-center justify-center">
                        {isActive ? (
                            currentOrder === 'asc' ?
                                <ArrowUp className="w-3 h-3 text-primary animate-in zoom-in" /> :
                                <ArrowDown className="w-3 h-3 text-primary animate-in zoom-in" />
                        ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
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
                <h3 className="text-sm font-semibold text-foreground opacity-60 tracking-widest">No Projects Identified</h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Try adjusting your active filters.</p>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 overflow-hidden">
            {/* MOBILE: High-Density Card List */}
            <div className="grid gap-2 md:hidden min-w-0">
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
                    <span className="text-xs font-semibold text-muted-foreground tracking-widest">Select All</span>
                </div>
                <AnimatePresence mode="popLayout">
                    {projects.map((project) => {
                        const isSelected = selectedIds.includes(project.id);
                        return (
                            <motion.div
                                key={project.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="min-w-0"
                            >
                                <Card
                                    className={cn(
                                        "rounded-3xl border shadow-sm transition-all cursor-pointer overflow-hidden",
                                        "touch-pan-y select-none",
                                        isSelected ? "border-primary bg-primary/[0.02]" : "border-border/40 bg-card"
                                    )}
                                    onPointerDown={() => startLongPress(project.id)}
                                    onPointerUp={clearLongPress}
                                    onPointerLeave={clearLongPress}
                                    onClick={() => {
                                        if (isSelectionMode) onSelectRow(project.id, !isSelected);
                                        else router.push(`/admin/projects/${project.id}/edit`);
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
                                                        onChange={(e) => onSelectRow(project.id, e.target.checked)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate leading-tight">{project.title}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className="text-[11px] font-mono bg-muted/60 px-1.5 py-0.5 rounded-3xl border border-border/40 text-muted-foreground">
                                                            ID: {project.id.split('-')[0]}
                                                        </span>
                                                        <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-3xl font-semibold tracking-tight border-primary/20 bg-primary/5 text-primary shadow-none">
                                                            {project.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
                                                <AdminProjectActions id={project.id} status={project.status} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end border-t border-border/40 pt-3 gap-4">
                                            <div className="space-y-1 min-w-0">
                                                <p className="text-[11px] font-semibold text-muted-foreground tracking-widest">Raised / Target</p>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <SmartCurrency amount={project.raisedAmount} currency={project.currency} visible={true} size="small" />
                                                    <span className="text-muted-foreground/50 text-[11px]">Of</span>
                                                    <span className="text-xs font-semibold text-muted-foreground">{formatCurrency(project.targetAmount, project.currency)}</span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[11px] font-semibold text-muted-foreground tabular-nums">{formatDate(project.createdAt).split(',')[0]}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* DESKTOP: Forensic Table */}
            <Card className="hidden md:block rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden w-full">
                <div className="overflow-x-auto no-scrollbar w-full">
                    <table className="w-full text-sm text-left border-collapse min-w-full">
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
                                <SortHeader title="Cause Details" column="title" />
                                <SortHeader title="Status" column="status" />
                                <SortHeader title="Launched Date" column="createdAt" />
                                <th className="px-5 py-3 font-semibold tracking-wider text-xs text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <TrendingUp className="h-3 w-3" /> Financials
                                    </div>
                                </th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {projects.map((project) => {
                                const isSelected = selectedIds.includes(project.id);
                                return (
                                    <tr
                                        key={project.id}
                                        className={cn(
                                            "hover:bg-muted/30 transition-all cursor-pointer group",
                                            isSelected ? "bg-primary/[0.01]" : ""
                                        )}
                                        onClick={() => router.push(`/admin/projects/${project.id}/edit`)}
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
                                                    onChange={(e) => onSelectRow(project.id, e.target.checked)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="min-w-[200px]">
                                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-sm">
                                                    {project.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[11px] font-mono bg-muted/50 px-1.5 py-0.5 rounded-3xl border border-border/40 text-muted-foreground">
                                                        ID: {project.id.split('-')[0]}
                                                    </span>
                                                    {project.categoryName && (
                                                        <span className="text-[11px] font-semibold text-primary/70 tracking-tight">
                                                            {project.categoryName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge
                                                variant={project.status === 'ACTIVE' ? 'success' : 'outline'}
                                                className="text-[11px] font-semibold px-2 py-0 rounded-3xl shadow-none"
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
                                                <div className="font-semibold tabular-nums text-foreground">
                                                    <SmartCurrency
                                                        amount={project.raisedAmount}
                                                        currency={project.currency}
                                                        visible={true}
                                                        size="small"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground tracking-tighter">
                                                    <Flag className="h-3 w-3 opacity-50" />
                                                    {formatCurrency(project.targetAmount, project.currency)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <AdminProjectActions id={project.id} status={project.status} />
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