'use client';

import React, { useState, memo } from 'react';
import {
    ShieldAlert,
    LogIn,
    CreditCard,
    Activity,
    ChevronDown,
    ChevronRight,
    FileJson,
    User,
    Monitor,
    ShieldCheck
} from 'lucide-react';
import { formatDate } from '../../../lib/utils/format';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils/cn';
import { Card, CardContent } from '../../ui/card';
import { motion, AnimatePresence } from 'framer-motion';

const getActionStyle = (action: string) => {
    if (action.includes('LOGIN')) return { icon: LogIn, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/10' };
    if (action.includes('WALLET') || action.includes('PAYMENT')) return { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/10' };
    if (action.includes('FAILED') || action.includes('RESTRICT') || action.includes('SUSPEND')) return { icon: ShieldAlert, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/10' };
    if (action.includes('VERIFIED') || action.includes('RESTORE')) return { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/10' };
    return { icon: Activity, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border/40' };
};

export const AuditTable = memo(function AuditTable({ logs }: { logs: any[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-border/40 bg-muted/5">
                <ShieldAlert className="h-10 w-10 mb-3 text-muted-foreground/30" />
                <p className="text-sm font-bold text-muted-foreground tracking-widest uppercase">No Audit Logs Found</p>
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
                                            <p className="text-sm font-bold text-foreground truncate tracking-tight">
                                                {log.action.replace(/_/g, ' ')}
                                            </p>
                                            <p className="text-[11px] font-medium text-muted-foreground">
                                                {formatDate(log.createdAt).split(',')[0]}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-2">
                                        {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "circOut" }}
                                            className="px-4 pb-4 space-y-3 overflow-hidden"
                                        >
                                            <div className="pt-3 border-t border-border/40 space-y-2">
                                                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                                    <span>Actor Node</span>
                                                    <span className="text-foreground normal-case font-bold">{log.user?.email || 'System Identity'}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                                    <span>Target Entity</span>
                                                    <span className="text-foreground normal-case font-bold">{log.entityType}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                                                    <span>IP Address</span>
                                                    <span className="text-foreground font-mono font-bold">{log.ipAddress}</span>
                                                </div>
                                            </div>
                                            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 shadow-inner">
                                                <pre className="text-[10px] text-zinc-400 font-mono overflow-x-auto whitespace-pre-wrap no-scrollbar">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* DESKTOP: Forensic Table */}
            <Card className="hidden md:block rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4 w-12"></th>
                            <th className="px-6 py-4 font-bold text-xs tracking-widest uppercase">Actor Identity</th>
                            <th className="px-6 py-4 font-bold text-xs tracking-widest uppercase">Action Event</th>
                            <th className="px-6 py-4 font-bold text-xs tracking-widest uppercase">Target Node</th>
                            <th className="px-6 py-4 font-bold text-xs tracking-widest text-right uppercase">Timestamp</th>
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
                                            isExpanded ? "bg-primary/[0.01]" : "hover:bg-muted/20"
                                        )}
                                    >
                                        <td className="px-6 py-4">
                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground" />}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground border border-border/50 shrink-0 shadow-inner">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-foreground text-xs truncate">
                                                        {log.user?.email || 'System / Anonymous'}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground font-mono opacity-60">
                                                        {log.ipAddress}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={cn("gap-1.5 px-2.5 py-0.5 rounded-3xl font-bold text-[11px] tracking-tight border-0 shadow-none", style.bg, style.color)}>
                                                <Icon className="h-3 w-3" />
                                                {log.action.replace(/_/g, ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-foreground">{log.entityType}</span>
                                                <span className="text-[11px] font-mono text-muted-foreground opacity-60 truncate max-w-[120px]">
                                                    ID: {log.entityId?.split('-')[0]}...
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-bold text-foreground tabular-nums">{formatDate(log.createdAt).split(',')[1]}</span>
                                                <span className="text-[11px] font-medium text-muted-foreground">{formatDate(log.createdAt).split(',')[0]}</span>
                                            </div>
                                        </td>
                                    </tr>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={5} className="p-0 border-none">
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2, ease: "circOut" }}
                                                        className="overflow-hidden bg-muted/[0.02]"
                                                    >
                                                        <div className="px-12 py-8 border-t border-border/20">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                                <div className="space-y-3">
                                                                    <h4 className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-2 uppercase">
                                                                        <FileJson className="h-3.5 w-3.5" /> Event Metadata
                                                                    </h4>
                                                                    <div className="bg-zinc-950 text-zinc-400 p-5 rounded-3xl text-xs font-mono border border-zinc-800 shadow-2xl h-[200px] overflow-y-auto no-scrollbar">
                                                                        <pre className="whitespace-pre-wrap">{JSON.stringify(log.metadata, null, 2)}</pre>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-6">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="p-4 rounded-3xl bg-card border border-border/40 shadow-sm">
                                                                            <p className="text-[10px] font-bold text-muted-foreground mb-1 tracking-widest uppercase">Audit ID</p>
                                                                            <p className="text-[11px] font-mono font-bold truncate select-all">{log.id}</p>
                                                                        </div>
                                                                        <div className="p-4 rounded-3xl bg-card border border-border/40 shadow-sm">
                                                                            <p className="text-[10px] font-bold text-muted-foreground mb-1 tracking-widest uppercase">Entity Reference</p>
                                                                            <p className="text-[11px] font-mono font-bold truncate select-all">{log.entityId}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-5 rounded-3xl bg-card border border-border/40 shadow-sm space-y-2">
                                                                        <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-2">
                                                                            <Monitor className="h-3.5 w-3.5" /> User Agent Trace
                                                                        </p>
                                                                        <p className="text-[11px] font-medium text-foreground leading-relaxed break-all font-mono opacity-80">{log.userAgent}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </Card>
        </div>
    );
});