'use client';

import React, { useEffect, useState } from 'react';
import {
    History, ShieldCheck, Clock,
    Smartphone, Monitor, Fingerprint,
    Loader2, ShieldAlert, KeyRound, User, Zap,
    ChevronDown, FileJson2, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { ApiService } from '../../../services/api';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Button } from '../../ui/button';

const actionConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    USER_LOGIN: { icon: User, color: "text-blue-600", bg: "bg-blue-50" },
    PASSWORD_CHANGE: { icon: KeyRound, color: "text-amber-600", bg: "bg-amber-50" },
    WALLET_FUND_SUCCESS: { icon: Zap, color: "text-emerald-600", bg: "bg-emerald-50" },
    PROFILE_UPDATED: { icon: User, color: "text-purple-600", bg: "bg-purple-50" },
    AVATAR_UPDATED: { icon: User, color: "text-purple-600", bg: "bg-purple-50" },
    TWO_FACTOR_ENABLED: { icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    TWO_FACTOR_DISABLED: { icon: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50" },
    USER_LOGIN_FAILED: { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/5" },
    TWO_FACTOR_VERIFY_FAILED: { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/5" },
    default: { icon: Fingerprint, color: "text-muted-foreground", bg: "bg-muted" }
};

export function UserAuditView() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(prevId => (prevId === id ? null : id));
    };

    const fetchLogs = async (pageNum: number) => {
        setIsLoading(true);
        try {
            const response = await ApiService.auth.getMyAuditLogs(pageNum);
            if (response?.data) {
                setLogs(prev => pageNum === 1 ? response.data : [...prev, ...response.data]);
                if (response.meta.page >= response.meta.lastPage) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Audit fetch failure", error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchLogs(nextPage);
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                <CardHeader className="p-5 md:p-6 border-b border-border/40 bg-muted/10">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                            <History className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold">Activity Logs</CardTitle>
                            <p className="text-xs text-muted-foreground font-medium tracking-tight">Account history</p>
                        </div>
                    </div>
                </CardHeader>

                <div className="p-0">
                    {/* MOBILE: High-Density Card List */}
                    <div className="block md:hidden divide-y divide-border/40">
                        {logs.map((log) => {
                            const config = actionConfig[log.action] || actionConfig.default;
                            const isExpanded = expandedId === log.id;
                            return (
                                <div key={log.id} className="p-4 space-y-3">
                                    <div className="flex items-center justify-between gap-4" onClick={() => toggleExpand(log.id)}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn("h-9 w-9 rounded-3xl flex items-center justify-center shrink-0 border border-border/10", config.bg, config.color)}>
                                                {React.createElement(config.icon, { className: "h-4 w-4" })}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground  tracking-tight truncate">
                                                    {log.action.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-xs text-muted-foreground font-medium">{formatDate(log.createdAt)}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground/30 transition-transform", isExpanded && "rotate-90")} />
                                    </div>
                                    {isExpanded && (
                                        <div className="pt-2 animate-in fade-in duration-200">
                                            <div className="bg-zinc-950 p-4 rounded-3xl text-xs font-mono text-zinc-300 overflow-x-auto border border-zinc-800">
                                                <pre className="whitespace-pre-wrap">{JSON.stringify(log.metadata || {}, null, 2)}</pre>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                                <div className="p-2.5 rounded-3xl bg-muted/30 border border-border/40">
                                                    <p className="text-muted-foreground font-bold  text-[11px]">Origin IP</p>
                                                    <p className="font-mono text-foreground truncate">{log.ipAddress}</p>
                                                </div>
                                                <div className="p-2.5 rounded-3xl bg-muted/30 border border-border/40">
                                                    <p className="text-muted-foreground font-bold  text-[11px]">User Agent</p>
                                                    <p className="truncate text-foreground">{log.userAgent}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* DESKTOP: Traditional Ledger Table */}
                    <table className="hidden md:table w-full text-left">
                        <thead className="bg-muted/30 text-xs font-bold  tracking-widest text-muted-foreground border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4 w-12"></th>
                                <th className="px-6 py-4">Event</th>
                                <th className="px-6 py-4">Context</th>
                                <th className="px-6 py-4 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-xs font-medium">
                            {logs.map((log) => {
                                const config = actionConfig[log.action] || actionConfig.default;
                                const isExpanded = expandedId === log.id;
                                return (
                                    <React.Fragment key={log.id}>
                                        <tr className="hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => toggleExpand(log.id)}>
                                            <td className="px-6 py-4">
                                                <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground/40 transition-transform", isExpanded && "rotate-90")} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("h-7 w-7 rounded-3xl flex items-center justify-center border border-border/10", config.bg, config.color)}>
                                                        {React.createElement(config.icon, { className: "h-3.5 w-3.5" })}
                                                    </div>
                                                    <span className="font-bold text-foreground  tracking-tight">{log.action.replace(/_/g, ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Monitor className="h-3.5 w-3.5" />
                                                    <span className="truncate max-w-[180px]">{log.userAgent}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">
                                                {formatDate(log.createdAt)}
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-muted/10">
                                                <td colSpan={4} className="p-6">
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-bold  tracking-widest text-muted-foreground flex items-center gap-2">
                                                                <FileJson2 className="h-3.5 w-3.5" /> Payload Detail
                                                            </p>
                                                            <div className="bg-zinc-950 p-4 rounded-3xl text-xs font-mono text-zinc-300 border border-zinc-800 h-32 overflow-y-auto no-scrollbar">
                                                                <pre>{JSON.stringify(log.metadata || {}, null, 2)}</pre>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="p-3 rounded-3xl border border-border/40 bg-card">
                                                                <p className="text-[11px] font-bold  text-muted-foreground">Identity ID</p>
                                                                <p className="font-mono text-foreground truncate">{log.id}</p>
                                                            </div>
                                                            <div className="p-3 rounded-3xl border border-border/40 bg-card">
                                                                <p className="text-[11px] font-bold  text-muted-foreground">Node IP</p>
                                                                <p className="font-mono text-foreground">{log.ipAddress}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {hasMore && logs.length > 0 && (
                    <div className="p-4 border-t border-border/40 text-center">
                        <Button variant="ghost" onClick={handleLoadMore} disabled={isLoading} className="h-9 px-8 rounded-3xl text-xs font-bold  tracking-widest text-muted-foreground hover:text-primary">
                            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : 'Fetch older records'}
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}