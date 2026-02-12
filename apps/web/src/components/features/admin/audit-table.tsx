'use client';

import React, { useState } from 'react';
import {
    ShieldAlert, LogIn, CreditCard, Activity,
    ChevronDown, ChevronRight, FileJson, User,
    Clock, Globe, Database
} from 'lucide-react';
import { formatDate } from '../../../lib/utils/format';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils/cn';
import { Card, CardContent } from '../../ui/card';

const getActionStyle = (action: string) => {
    if (action.includes('LOGIN')) return { icon: LogIn, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/10' };
    if (action.includes('WALLET') || action.includes('PAYMENT')) return { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/10' };
    if (action.includes('FAILED') || action.includes('SUSPEND')) return { icon: ShieldAlert, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/10' };
    return { icon: Activity, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border/40' };
};

export function AuditTable({ logs }: { logs: any[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-border/40 bg-muted/5">
                <ShieldAlert className="h-10 w-10 mb-3 text-muted-foreground/30" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No audit logs found</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* MOBILE: High-Density Card List */}
            <div className="grid gap-2 md:hidden">
                {logs.map((log) => {
                    const style = getActionStyle(log.action);
                    const isExpanded = expandedId === log.id;
                    return (
                        <Card
                            key={log.id}
                            className="rounded-3xl border-border/40 shadow-sm overflow-hidden"
                        >
                            <CardContent className="p-0">
                                <button
                                    onClick={() => toggleExpand(log.id)}
                                    className="w-full p-4 flex items-center justify-between gap-4 text-left active:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn("h-10 w-10 rounded-3xl flex items-center justify-center shrink-0 border", style.bg, style.color, style.border)}>
                                            <style.icon className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground truncate uppercase tracking-tight">
                                                {log.action.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-[11px] font-medium text-muted-foreground uppercase">
                                                {formatDate(log.createdAt).split(',')[0]}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-2">
                                        {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="pt-3 border-t border-border/40 space-y-2">
                                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                <span>Actor</span>
                                                <span className="text-foreground">{log.user?.email || 'System'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                <span>Target</span>
                                                <span className="text-foreground">{log.entityType}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                <span>IP Address</span>
                                                <span className="text-foreground font-mono">{log.ipAddress}</span>
                                            </div>
                                        </div>
                                        <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                                            <pre className="text-[9px] text-zinc-400 font-mono overflow-x-auto whitespace-pre-wrap">
                                                {JSON.stringify(log.metadata, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* DESKTOP: Standard Refined Table */}
            <Card className="hidden md:block rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4 w-12"></th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest">Actor</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest">Action</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest">Target</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest text-right">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {logs.map((log) => {
                            const style = getActionStyle(log.action);
                            const Icon = style.icon;
                            const isExpanded = expandedId === log.id;

                            return (
                                <React.Fragment key={log.id}>
                                    <tr
                                        onClick={() => toggleExpand(log.id)}
                                        className={cn(
                                            "cursor-pointer transition-colors group",
                                            isExpanded ? "bg-muted/30" : "hover:bg-muted/20"
                                        )}
                                    >
                                        <td className="px-6 py-4">
                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground" />}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground border border-border/50">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-foreground text-xs truncate">
                                                        {log.user?.email || 'System / Guest'}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground font-mono opacity-60">
                                                        {log.ipAddress}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={cn("gap-1.5 px-2 py-0 rounded-3xl font-bold text-[11px] uppercase tracking-tight border-0 shadow-none", style.bg, style.color)}>
                                                <Icon className="h-3 w-3" />
                                                {log.action.replace(/_/g, ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-foreground">{log.entityType}</span>
                                                <span className="text-[11px] font-mono text-muted-foreground opacity-60 truncate max-w-[120px]">
                                                    {log.entityId?.split('-')[0]}...
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-bold text-foreground tabular-nums">{formatDate(log.createdAt).split(',')[1]}</span>
                                                <span className="text-[11px] font-medium text-muted-foreground uppercase">{formatDate(log.createdAt).split(',')[0]}</span>
                                            </div>
                                        </td>
                                    </tr>

                                    {isExpanded && (
                                        <tr className="bg-muted/5">
                                            <td colSpan={5} className="px-10 py-6 border-t border-border/20">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                            <FileJson className="h-3.5 w-3.5" /> Event Metadata
                                                        </h4>
                                                        <div className="bg-zinc-950 text-zinc-400 p-4 rounded-3xl text-xs font-mono border border-zinc-800 shadow-inner">
                                                            <pre className="whitespace-pre-wrap">{JSON.stringify(log.metadata, null, 2)}</pre>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="p-4 rounded-3xl bg-card border border-border/40">
                                                                <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Audit ID</p>
                                                                <p className="text-[11px] font-mono font-bold truncate select-all">{log.id}</p>
                                                            </div>
                                                            <div className="p-4 rounded-3xl bg-card border border-border/40">
                                                                <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Entity Reference</p>
                                                                <p className="text-[11px] font-mono font-bold truncate select-all">{log.entityId}</p>
                                                            </div>
                                                        </div>
                                                        <div className="p-4 rounded-3xl bg-card border border-border/40">
                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">User Agent Trace</p>
                                                            <p className="text-[11px] font-medium text-foreground leading-relaxed break-all">{log.userAgent}</p>
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
            </Card>
        </div>
    );
}