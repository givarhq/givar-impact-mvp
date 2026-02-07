'use client';

import React, { useEffect, useState } from 'react';
import {
    History, ShieldCheck, Globe, Clock,
    Smartphone, Monitor, ChevronRight, Fingerprint,
    Loader2, ShieldAlert, KeyRound, User, Mail, Zap,
    ChevronDown, FileJson2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { ApiService } from '../../../services/api';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Button } from '../../ui/button';

// Enhanced visual mapping for audit actions
const auditActionConfig: Record<string, { icon: React.ElementType; color: string }> = {
    USER_LOGIN: { icon: User, color: "text-blue-500" },
    PASSWORD_CHANGE: { icon: KeyRound, color: "text-amber-500" },
    WALLET_FUND_SUCCESS: { icon: Zap, color: "text-emerald-500" },
    PROFILE_UPDATED: { icon: User, color: "text-purple-500" },
    AVATAR_UPDATED: { icon: User, color: "text-purple-500" },
    TWO_FACTOR_ENABLED: { icon: ShieldCheck, color: "text-emerald-500" },
    TWO_FACTOR_DISABLED: { icon: ShieldAlert, color: "text-amber-500" },
    USER_LOGIN_FAILED: { icon: ShieldAlert, color: "text-destructive" },
    TWO_FACTOR_VERIFY_FAILED: { icon: ShieldAlert, color: "text-destructive" },
    default: { icon: Fingerprint, color: "text-muted-foreground" }
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
            console.error("Forensic retrieval failed", error);
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
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden">
                <CardHeader className="p-8 border-b border-border/40 bg-muted/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                                <History className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Security Audit Log</CardTitle>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
                                    Forensic history of your account nodes and credential access.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                            Ledger Connection: Secure
                        </div>
                    </div>
                </CardHeader>

                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40">
                            <tr>
                                <th className="px-6 py-4 w-12"></th>
                                <th className="px-6 py-4 w-[40%]">Event Details</th>
                                <th className="px-6 py-4 hidden md:table-cell">Device & Network</th>
                                <th className="px-8 py-4 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-sm">
                            {isLoading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4}>
                                        <div className="p-20 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Decrypting Activity Logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4}>
                                        <div className="p-20 text-center text-muted-foreground">
                                            <ShieldAlert className="h-10 w-10 mx-auto mb-4 opacity-10" />
                                            <p className="text-sm font-medium">No forensic activity found in recent sessions.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const isExpanded = expandedId === log.id;
                                    const config = auditActionConfig[log.action] || auditActionConfig.default;
                                    const Icon = config.icon;
                                    const isMobile = log.userAgent?.toLowerCase().includes('iphone') || log.userAgent?.toLowerCase().includes('android');

                                    return (
                                        <React.Fragment key={log.id}>
                                            <tr
                                                onClick={() => toggleExpand(log.id)}
                                                className={cn(
                                                    "transition-colors group cursor-pointer",
                                                    isExpanded ? "bg-muted/30" : "hover:bg-muted/10"
                                                )}
                                            >
                                                <td className="px-6 py-5">
                                                    {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 opacity-30 group-hover:opacity-100" />}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border", config.color.replace('text-', 'bg-') + '/10', config.color.replace('text-', 'border-') + '/20', config.color)}>
                                                            <Icon className="h-4 w-4" />
                                                        </div>
                                                        <p className="font-bold text-foreground uppercase text-xs tracking-tight">
                                                            {log.action.replace(/_/g, ' ')}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 hidden md:table-cell">
                                                    <div className="flex items-center gap-2">
                                                        {isMobile ? <Smartphone className="h-3.5 w-3.5 text-muted-foreground" /> : <Monitor className="h-3.5 w-3.5 text-muted-foreground" />}
                                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{log.userAgent}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs font-semibold text-foreground tabular-nums">{formatDate(log.createdAt).split(',')[1]}</span>
                                                        <span className="text-[10px] text-muted-foreground/60 font-medium">{formatDate(log.createdAt).split(',')[0]}</span>
                                                    </div>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr className="bg-muted/10 animate-in fade-in duration-300">
                                                    <td colSpan={4} className="p-0">
                                                        <div className="py-8 px-12 grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-border/60">
                                                            <div className="space-y-3">
                                                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                                                    <FileJson2 className="h-4 w-4" /> Forensic Metadata
                                                                </h4>
                                                                <div className="bg-zinc-950 text-zinc-300 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-zinc-800 shadow-inner h-48">
                                                                    <pre>{JSON.stringify(log.metadata || { info: "No additional metadata recorded for this event." }, null, 2)}</pre>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-6 text-xs bg-card border border-border/50 p-6 rounded-2xl">
                                                                <div>
                                                                    <span className="font-bold text-muted-foreground uppercase text-[9px] tracking-widest">Log ID</span>
                                                                    <p className="font-mono select-all break-all text-foreground/80 mt-1">{log.id}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-muted-foreground uppercase text-[9px] tracking-widest">Origin IP</span>
                                                                    <p className="font-mono select-all text-foreground/80 mt-1">{log.ipAddress}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {hasMore && !isLoading && logs.length > 0 && (
                    <div className="p-4 border-t border-border/40">
                        <Button variant="ghost" className="w-full h-11 text-xs font-bold uppercase tracking-widest text-muted-foreground" onClick={handleLoadMore}>
                            Load More Entries
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}