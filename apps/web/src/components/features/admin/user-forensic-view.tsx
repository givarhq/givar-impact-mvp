'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShieldCheck, Mail, Calendar, Wallet, Heart,
    Lock, Unlock, ShieldAlert, History, Activity,
    TrendingUp, ExternalLink, Loader2, Fingerprint,
    UserCheck, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { SmartCurrency } from '../../ui/smart-currency';
import { formatDate } from '../../../lib/utils/format';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';

export function UserForensicView({ user }: { user: any }) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const isLocked = !!user.accountLockedUntil;

    const handleStatusToggle = async () => {
        const action = isLocked ? 'UNLOCK' : 'LOCK';
        if (!confirm(`Are you sure you want to ${action} this account? This will immediately terminate all active sessions.`)) return;

        setIsProcessing(true);
        try {
            await ApiService.admin.updateUserStatus(user.id, action);
            toast.success(`Account successfully ${action === 'LOCK' ? 'deactivated' : 'restored'}`);
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Status update failed");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* --- SIDEBAR: IDENTITY & CONTROLS --- */}
            <div className="lg:col-span-4 space-y-6">
                <Card className="rounded-[32px] border-border/50 bg-card overflow-hidden shadow-xl relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-transparent to-transparent opacity-20" />
                    <div className="p-8 text-center space-y-5">
                        <div className="relative inline-block">
                            <div className="h-28 w-28 rounded-[40px] bg-primary/10 flex items-center justify-center text-primary text-4xl font-black shadow-inner mx-auto border-2 border-primary/5">
                                {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div className={cn(
                                "absolute -bottom-1 -right-1 h-10 w-10 rounded-2xl border-4 border-card flex items-center justify-center shadow-2xl",
                                isLocked ? "bg-destructive text-white" : "bg-emerald-500 text-white"
                            )}>
                                {isLocked ? <Lock className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tight text-foreground">{user.firstName} {user.lastName}</h2>
                            <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-3 py-1 rounded-lg inline-block select-all">
                                {user.id}
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2">
                            <Badge variant="outline" className="rounded-lg bg-secondary/50 px-2 py-1 text-[9px] font-black uppercase tracking-widest border-border/50">
                                {user.role}
                            </Badge>
                            <Badge variant="outline" className="rounded-lg bg-secondary/50 px-2 py-1 text-[9px] font-black uppercase tracking-widest border-border/50">
                                {user.accountType}
                            </Badge>
                            {user.emailVerified && (
                                <Badge className="rounded-lg bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                                    Verified
                                </Badge>
                            )}
                        </div>
                    </div>

                    <CardContent className="p-8 pt-0 space-y-4">
                        <div className="h-px bg-border/50 w-full mb-6" />
                        <Button
                            variant={isLocked ? "default" : "destructive"}
                            className={cn(
                                "w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.15em] gap-2 shadow-lg transition-all active:scale-95",
                                !isLocked && "shadow-destructive/20"
                            )}
                            onClick={handleStatusToggle}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : isLocked ? <Unlock className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                            {isLocked ? "Restore Global Access" : "Restrict Account Access"}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground leading-relaxed italic px-4">
                            Status changes are logged and visible to the system compliance node.
                        </p>
                    </CardContent>
                </Card>

                <Card className="rounded-[28px] border-border/50 bg-card overflow-hidden shadow-sm">
                    <CardHeader className="bg-muted/30 border-b border-border/50 py-4 px-6">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                            <Fingerprint className="h-4 w-4 text-primary" /> Lifecycle Metrics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-border/40">
                            <span className="text-xs font-semibold text-muted-foreground">Onboarding Date</span>
                            <span className="text-xs font-bold text-foreground">{formatDate(user.createdAt).split(',')[0]}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/40">
                            <span className="text-xs font-semibold text-muted-foreground">Primary Auth</span>
                            <span className="text-xs font-bold text-foreground">{user.email}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-xs font-semibold text-muted-foreground">Brute-Force Risk</span>
                            <span className={cn(
                                "text-xs font-mono font-black",
                                user.failedLoginAttempts > 0 ? "text-destructive" : "text-emerald-500"
                            )}>{user.failedLoginAttempts} Attempts</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- MAIN: FINANCIALS & AUDIT LOGS --- */}
            <div className="lg:col-span-8 space-y-8">

                {/* 1. Forensics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-6 bg-emerald-500/[0.03] border-emerald-500/10 rounded-[28px] relative overflow-hidden group hover:shadow-md transition-all">
                        <TrendingUp className="absolute -bottom-2 -right-2 h-16 w-16 text-emerald-500 opacity-5 transition-transform group-hover:scale-110" />
                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-2">Lifetime Impact (LIV)</p>
                        <SmartCurrency amount={user.lifetimeImpact} currency="NGN" visible={true} size="default" className="text-emerald-700" />
                    </Card>

                    <Card className="p-6 bg-primary/5 border-primary/10 rounded-[28px] relative overflow-hidden">
                        <Heart className="absolute -bottom-2 -right-2 h-16 w-16 text-primary opacity-5" />
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-2">Total Contributions</p>
                        <h4 className="text-3xl font-black text-foreground tabular-nums">{user._count.donations}</h4>
                    </Card>

                    <Card className="p-6 bg-blue-500/5 border-blue-500/10 rounded-[28px] relative overflow-hidden">
                        <Activity className="absolute -bottom-2 -right-2 h-16 w-16 text-blue-500 opacity-5" />
                        <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-2">Causes Launched</p>
                        <h4 className="text-3xl font-black text-foreground tabular-nums">{user._count.projects}</h4>
                    </Card>
                </div>

                {/* 2. Wallet States */}
                <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden">
                    <CardHeader className="p-6 border-b border-border/50 bg-muted/10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-primary" /> Forensic Ledger Access
                        </CardTitle>
                    </CardHeader>
                    <div className="p-0">
                        {user.wallets.length === 0 ? (
                            <div className="p-10 text-center text-xs text-muted-foreground italic">No currency wallets initialized.</div>
                        ) : user.wallets.map((w: any) => (
                            <div key={w.id} className="flex items-center justify-between p-6 border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors group">
                                <div className="flex items-center gap-5">
                                    <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center font-black text-sm border border-border shadow-sm">
                                        {w.currency}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Available Liquidity</p>
                                        <SmartCurrency amount={w.balance} currency={w.currency} visible={true} size="default" className="text-foreground" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="hidden md:block text-right pr-4">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Version</p>
                                        <p className="text-xs font-mono font-bold">V{w.version}</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-bold uppercase tracking-widest h-9 px-4 border-border/60 hover:bg-primary hover:text-white hover:border-primary transition-all shadow-none">
                                        View Full Ledger
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* 3. Security Audit Trail */}
                <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden">
                    <CardHeader className="p-6 border-b border-border/50 bg-muted/10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                            <History className="h-4 w-4 text-primary" /> Real-time Security Stream
                        </CardTitle>
                    </CardHeader>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-muted/30 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40">
                                <tr>
                                    <th className="px-8 py-4">Forensic Action</th>
                                    <th className="px-6 py-4">Origin IP</th>
                                    <th className="px-6 py-4 text-right">Registered At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 text-xs">
                                {user.auditLogs.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="px-8 py-5">
                                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-tight rounded-lg border-border/60 bg-background py-1 px-2">
                                                {log.action.replace(/_/g, ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-mono text-xs text-muted-foreground font-medium flex items-center gap-2">
                                                <Activity className="h-3 w-3 opacity-30" /> {log.ipAddress || 'Internal'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right font-medium text-muted-foreground tabular-nums">
                                            {formatDate(log.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {user.auditLogs.length === 0 && (
                        <div className="p-12 text-center text-xs text-muted-foreground italic">No security events found on current node.</div>
                    )}
                </Card>

            </div>
        </div>
    );
}