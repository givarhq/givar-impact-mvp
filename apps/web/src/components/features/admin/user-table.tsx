'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2,
    Clock, Lock, XCircle, ArrowUpRight, Inbox
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { SmartCurrency } from '../../ui/smart-currency';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';

interface UserTableProps {
    users: any[];
    currentSort: string;
    currentOrder: string;
    selectedIds: string[];
    onSelectAll: (checked: boolean) => void;
    onSelectRow: (id: string, checked: boolean) => void;
}

export function UserTable({
    users,
    currentSort,
    currentOrder,
    selectedIds,
    onSelectAll,
    onSelectRow
}: UserTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const isAnySelected = selectedIds.length > 0;
    const isAllSelected = users.length > 0 && selectedIds.length === users.length;

    const handleSort = (key: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const newOrder = (currentSort === key && currentOrder === 'desc') ? 'asc' : 'desc';
        params.set('sortBy', key);
        params.set('sortOrder', newOrder);
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const SortHeader = ({ label, sortKey, align = "left" }: { label: string, sortKey: string, align?: "left" | "right" | "center" }) => {
        const isActive = currentSort === sortKey;
        return (
            <th
                className={cn(
                    "px-4 py-5 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-primary transition-colors select-none group",
                    align === "right" && "text-right",
                    align === "center" && "text-center"
                )}
                onClick={() => handleSort(sortKey)}
            >
                <div className={cn("flex items-center gap-2", align === "right" && "justify-end")}>
                    {label}
                    <div className="w-3 h-3 flex items-center justify-center">
                        {isActive ? (
                            currentOrder === 'asc' ?
                                <ArrowUp className="w-3 h-3 text-primary animate-in zoom-in duration-300" /> :
                                <ArrowDown className="w-3 h-3 text-primary animate-in zoom-in duration-300" />
                        ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                        )}
                    </div>
                </div>
            </th>
        );
    };

    if (users.length === 0) {
        return (
            <div className="py-24 text-center border-2 border-dashed border-border rounded-[32px] bg-muted/20">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-semibold text-foreground">No entities found</h3>
                <p className="text-sm text-muted-foreground mt-1">Adjust filters or search parameters.</p>
            </div>
        );
    }

    return (
        <div className="rounded-[32px] border border-border bg-card shadow-xl overflow-hidden relative">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/40 text-muted-foreground border-b border-border group/header">
                        <tr>
                            <th className="px-4 py-5 w-[48px]">
                                <div className={cn(
                                    "transition-opacity duration-200",
                                    isAnySelected ? "opacity-100" : "opacity-0 group-hover/header:opacity-100"
                                )}>
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                                        checked={isAllSelected}
                                        onChange={(e) => onSelectAll(e.target.checked)}
                                    />
                                </div>
                            </th>
                            <SortHeader label="User Identity" sortKey="firstName" />
                            <SortHeader label="Account Type" sortKey="accountType" />
                            <SortHeader label="Status" sortKey="emailVerified" />
                            <SortHeader label="Impact Value" sortKey="impactValue" align="right" />
                            <SortHeader label="Registration" sortKey="createdAt" align="right" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((user) => {
                            const isSelected = selectedIds.includes(user.id);
                            return (
                                <tr
                                    key={user.id}
                                    className={cn(
                                        "hover:bg-muted/30 transition-all cursor-pointer group/row",
                                        isSelected ? "bg-primary/[0.04]" : (user.isLocked && "bg-destructive/[0.02]")
                                    )}
                                    onClick={() => router.push(`/admin/users/${user.id}`)}
                                >
                                    <td className="px-4 py-6" onClick={(e) => e.stopPropagation()}>
                                        <div className={cn(
                                            "transition-opacity duration-200",
                                            (isAnySelected || isSelected) ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"
                                        )}>
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                                                checked={isSelected}
                                                onChange={(e) => onSelectRow(user.id, e.target.checked)}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-11 w-11 rounded-2xl flex items-center justify-center text-sm font-black shadow-inner transition-all group-hover:scale-105",
                                                user.role === 'ADMIN' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                                            )}>
                                                {user.firstName?.[0]}{user.lastName?.[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                                    {user.firstName} {user.lastName}
                                                    {user.isLocked && <Lock className="h-3 w-3 text-destructive" />}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[180px] font-medium">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            <Badge variant="outline" className="w-fit text-[9px] font-black tracking-widest rounded-md bg-secondary/50 border-border/50">
                                                {user.role}
                                            </Badge>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{user.accountType}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        {user.isLocked ? (
                                            <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] font-black uppercase tracking-widest gap-1.5">
                                                <XCircle className="h-3 w-3" /> Locked
                                            </Badge>
                                        ) : user.emailVerified ? (
                                            <div className="flex items-center text-emerald-500 text-[10px] font-black uppercase tracking-tighter">
                                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Verified
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-amber-500 text-[10px] font-black uppercase tracking-tighter">
                                                <Clock className="h-3.5 w-3.5 mr-1.5" /> Pending
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <SmartCurrency amount={user.lifetimeImpact} currency="NGN" visible={true} size="small" className="text-foreground" />
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{user._count.donations} Gifts</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs font-bold text-foreground tabular-nums">{formatDate(user.createdAt).split(',')[0]}</span>
                                            <button className="text-[9px] font-black uppercase text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Forensics <ArrowUpRight className="h-2.5 w-2.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}