'use client';

import React, { useRef, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
    ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2,
    Clock, Lock, ArrowUpRight, Inbox, ShieldAlert
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Card, CardContent } from '../../ui/card';
import { SmartCurrency } from '../../ui/smart-currency';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface UserTableProps {
    users: any[];
    currentSort: string;
    currentOrder: string;
    selectedIds: string[];
    onSelectAll: (checked: boolean) => void;
    onSelectRow: (id: string, checked: boolean) => void;
}

export const UserTable = memo(function UserTable({
    users,
    currentSort,
    currentOrder,
    selectedIds,
    onSelectAll,
    onSelectRow
}: UserTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const isAnySelected = selectedIds.length > 0;
    const isAllSelected = users.length > 0 && selectedIds.length === users.length;
    const isSelectionMode = isAnySelected;

    const handleSort = (key: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const newOrder = (currentSort === key && currentOrder === 'desc') ? 'asc' : 'desc';
        params.set('sortBy', key);
        params.set('sortOrder', newOrder);
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const startLongPress = (id: string) => {
        longPressTimer.current = setTimeout(() => {
            onSelectRow(id, true);
            if (window.navigator.vibrate) window.navigator.vibrate(50);
        }, 500);
    };

    const clearLongPress = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const SortHeader = ({ label, sortKey, align = "left" }: { label: string, sortKey: string, align?: "left" | "right" | "center" }) => {
        const isActive = currentSort === sortKey;
        return (
            <th
                className={cn(
                    "px-4 py-3 font-semibold tracking-wider text-xs cursor-pointer hover:text-primary transition-colors select-none group",
                    align === "right" && "text-right",
                    align === "center" && "text-center"
                )}
                onClick={() => handleSort(sortKey)}
            >
                <div className={cn("flex items-center gap-1.5", align === "right" && "justify-end")}>
                    {label}
                    <div className="w-3 h-3 flex items-center justify-center">
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

    if (users.length === 0) {
        return (
            <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-semibold text-foreground opacity-60 tracking-widest">Pipeline Empty</h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">No users found.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* MOBILE: High-Density Card List */}
            <div className="grid gap-2 md:hidden min-w-0">
                <div className={cn(
                    "flex items-center justify-between px-2 mb-1 transition-opacity duration-200 min-w-0",
                    isSelectionMode ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                    <div className="flex items-center gap-2 min-w-0">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded-3xl border-border/40 text-primary focus:ring-primary/20 shrink-0"
                            checked={isAllSelected}
                            onChange={(e) => onSelectAll(e.target.checked)}
                        />
                        <span className="text-xs font-semibold text-muted-foreground tracking-widest truncate">Select All</span>
                    </div>
                    {isAnySelected && (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-3xl shrink-0">{selectedIds.length} Selected</span>
                    )}
                </div>

                <AnimatePresence mode="popLayout">
                    {users.map((user) => {
                        const isSelected = selectedIds.includes(user.id);
                        const isLocked = user.isLocked;
                        const kycStatus = user.kycStatus || 'NOT_SUBMITTED';

                        return (
                            <motion.div
                                key={user.id}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="min-w-0"
                            >
                                <Card
                                    className={cn(
                                        "rounded-3xl border-border/40 shadow-sm transition-all active:scale-[0.98]",
                                        "touch-pan-y select-none min-w-0",
                                        isSelected ? "ring-2 ring-primary/20 bg-primary/[0.02]" : "bg-card"
                                    )}
                                    onPointerDown={() => startLongPress(user.id)}
                                    onPointerUp={clearLongPress}
                                    onPointerLeave={clearLongPress}
                                    onClick={() => {
                                        if (isSelectionMode) onSelectRow(user.id, !isSelected);
                                        else router.push(`/admin/users/${user.id}`);
                                    }}
                                >
                                    <CardContent className="p-4 flex items-center justify-between gap-4 min-w-0">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={cn(
                                                    "transition-all duration-200",
                                                    isSelectionMode ? "w-4 opacity-100" : "w-0 opacity-0"
                                                )}>
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded-3xl border-border/40 text-primary shrink-0"
                                                        checked={isSelected}
                                                        onChange={(e) => onSelectRow(user.id, e.target.checked)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                {user.avatarUrl ? (
                                                    <div className="relative h-10 w-10 rounded-3xl overflow-hidden shrink-0 border border-border/10 bg-muted">
                                                        <Image src={user.avatarUrl} fill sizes="40px" className="object-cover" alt="" />
                                                    </div>
                                                ) : (
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-3xl flex items-center justify-center font-semibold text-xs border border-border/10 shrink-0",
                                                        user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? "bg-destructive/5 text-destructive" : "bg-primary/5 text-primary"
                                                    )}>
                                                        {user.firstName[0]}{user.lastName[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate">{user.firstName} {user.lastName}</p>
                                                    {isLocked && <Lock className="h-3 w-3 text-destructive shrink-0" />}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 min-w-fit">
                                            <div className="font-semibold text-xs whitespace-nowrap">
                                                <SmartCurrency amount={user.lifetimeImpact} currency="NGN" visible={true} size="small" />
                                            </div>
                                            <Badge variant="outline" className={cn(
                                                "text-[11px] px-1.5 py-0 rounded-3xl mt-1 font-semibold whitespace-nowrap shadow-none border",
                                                kycStatus === 'VERIFIED' ? "text-emerald-600 border-emerald-100 bg-emerald-50" :
                                                    kycStatus === 'PENDING' ? "text-amber-600 border-amber-100 bg-amber-50" :
                                                        kycStatus === 'REJECTED' ? "text-destructive border-destructive/20 bg-destructive/10" :
                                                            user.emailVerified ? "text-blue-600 border-blue-100 bg-blue-50" :
                                                                "text-muted-foreground border-border/40 bg-muted/30"
                                            )}>
                                                {user.accountType}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* DESKTOP: Table */}
            <Card className="hidden md:block rounded-3xl border-border/40 shadow-sm overflow-hidden bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-muted/40 border-b border-border/40 group">
                            <tr>
                                <th className="px-5 py-4 w-[50px]">
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
                                <SortHeader label="Identity" sortKey="firstName" />
                                <SortHeader label="Account Mode" sortKey="accountType" />
                                <SortHeader label="Identity Status" sortKey="emailVerified" />
                                <SortHeader label="Lifetime Impact" sortKey="impactValue" align="right" />
                                <SortHeader label="Joined Date" sortKey="createdAt" align="right" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {users.map((user) => {
                                const isSelected = selectedIds.includes(user.id);
                                const isLocked = user.isLocked;
                                const kycStatus = user.kycStatus || 'NOT_SUBMITTED';

                                return (
                                    <tr
                                        key={user.id}
                                        className={cn(
                                            "hover:bg-muted/30 transition-all cursor-pointer group",
                                            isSelected ? "bg-primary/[0.02]" : (isLocked && "bg-destructive/[0.01]")
                                        )}
                                        onClick={() => router.push(`/admin/users/${user.id}`)}
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
                                                    onChange={(e) => onSelectRow(user.id, e.target.checked)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                {user.avatarUrl ? (
                                                    <div className="relative h-8 w-8 rounded-3xl overflow-hidden shrink-0 border border-border/10 bg-muted">
                                                        <Image src={user.avatarUrl} fill sizes="32px" className="object-cover" alt="" />
                                                    </div>
                                                ) : (
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-3xl flex items-center justify-center text-xs font-semibold border border-border/10 shrink-0",
                                                        user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? "bg-destructive/5 text-destructive" : "bg-primary/5 text-primary"
                                                    )}>
                                                        {user.firstName[0]}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                                                        {user.firstName} {user.lastName}
                                                        {isLocked && <Lock className="h-3 w-3 text-destructive" />}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge variant="outline" className="text-[11px] font-semibold rounded-3xl bg-muted/30 border-border/40">
                                                {user.accountType}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-4">
                                            {isLocked ? (
                                                <div className="flex items-center text-destructive text-xs font-semibold gap-1.5">
                                                    <ShieldAlert className="h-3.5 w-3.5" /> Locked
                                                </div>
                                            ) : kycStatus === 'VERIFIED' ? (
                                                <div className="flex items-center text-emerald-600 text-xs font-semibold gap-1.5">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> KYC Verified
                                                </div>
                                            ) : kycStatus === 'PENDING' ? (
                                                <div className="flex items-center text-amber-600 text-xs font-semibold gap-1.5">
                                                    <Clock className="h-3.5 w-3.5" /> KYC Pending
                                                </div>
                                            ) : kycStatus === 'REJECTED' ? (
                                                <div className="flex items-center text-destructive text-xs font-semibold gap-1.5">
                                                    <ShieldAlert className="h-3.5 w-3.5" /> KYC Rejected
                                                </div>
                                            ) : user.emailVerified ? (
                                                <div className="flex items-center text-blue-600 text-xs font-semibold gap-1.5">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Email Verified
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-muted-foreground text-xs font-semibold gap-1.5">
                                                    <Clock className="h-3.5 w-3.5" /> Unverified
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <SmartCurrency amount={user.lifetimeImpact} currency="NGN" visible={true} size="small" />
                                                <span className="text-[11px] font-semibold text-muted-foreground mt-0.5">{user._count.donations} Gifts</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <p className="text-xs font-semibold text-foreground tabular-nums">{formatDate(user.createdAt).split(',')[0]}</p>
                                            <div className="flex items-center justify-end gap-1 text-primary text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                                                Audit <ArrowUpRight className="h-3 w-3" />
                                            </div>
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