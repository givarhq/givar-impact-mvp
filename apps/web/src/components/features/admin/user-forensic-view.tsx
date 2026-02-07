'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShieldCheck, Mail, Calendar, Wallet, Heart,
    Lock, Unlock, ShieldAlert, History, Activity,
    TrendingUp, ExternalLink, Loader2, Fingerprint,
    UserCheck, AlertTriangle, UserSearch
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { SmartCurrency } from '../../ui/smart-currency';
import { ConfirmModal } from '../../ui/confirm-modal';
import { formatDate } from '../../../lib/utils/format';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import { setCookie, getCookie } from 'cookies-next';
import toast from 'react-hot-toast';

interface UserForensicViewProps {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        accountType: string;
        emailVerified: boolean;
        createdAt: string;
        accountLockedUntil: string | null;
        failedLoginAttempts: number;
        lifetimeImpact: string;
        wallets: Array<{
            id: string;
            currency: string;
            balance: string;
            version: number;
        }>;
        _count: {
            donations: number;
            projects: number;
            subscriptions: number;
        };
        auditLogs: Array<{
            id: string;
            action: string;
            ipAddress: string;
            createdAt: string;
        }>;
    };
}

export function UserForensicView({ user }: UserForensicViewProps) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal States
    const [showImpersonateConfirm, setShowImpersonateConfirm] = useState(false);
    const [statusConfirm, setStatusConfirm] = useState<{ isOpen: boolean; action: 'LOCK' | 'UNLOCK' | null }>({
        isOpen: false,
        action: null
    });

    const isLocked = !!user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date();

    const onConfirmImpersonate = async () => {
        setIsProcessing(true);
        try {
            const currentToken = getCookie('givar_token');
            const currentUser = getCookie('givar_user');

            const response = await ApiService.admin.impersonate(user.id);

            // 1. Vault original Admin Identity
            setCookie('givar_admin_backup_token', currentToken, { path: '/' });
            setCookie('givar_admin_backup_user', currentUser, { path: '/' });

            // 2. Switch to User Persona
            setCookie('givar_token', response.accessToken, { path: '/' });
            setCookie('givar_user', JSON.stringify(response.user), { path: '/' });
            setCookie('givar_is_impersonating', 'true', { path: '/' });

            toast.success(`Perspective shifted: ${user.firstName}`);
            window.location.href = '/dashboard';
        } catch (e) {
            toast.error('Failed to establish forensic session');
            setIsProcessing(false);
            setShowImpersonateConfirm(false);
        }
    };

    const onConfirmStatusToggle = async () => {
        const action = statusConfirm.action;
        if (!action) return;

        setIsProcessing(true);
        try {
            await ApiService.admin.updateUserStatus(user.id, action);
            toast.success(`Account ${action === 'LOCK' ? 'restricted' : 'restored'}`);
            setStatusConfirm({ isOpen: false, action: null });
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Status update failed");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* --- LEFT: IDENTITY & CONTROLS --- */}
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

                        <CardContent className="p-8 pt-0 space-y-3">
                            <div className="h-px bg-border/50 w-full mb-3" />

                            <Button
                                className="w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-widest gap-2 bg-secondary text-foreground hover:bg-primary hover:text-white transition-all shadow-none border-0"
                                onClick={() => setShowImpersonateConfirm(true)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : <UserSearch className="h-4 w-4" />}
                                View Perspective
                            </Button>

                            <Button
                                variant={isLocked ? "default" : "destructive"}
                                className={cn(
                                    "w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest gap-2 shadow-sm transition-all border-0",
                                    !isLocked && "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
                                )}
                                onClick={() => setStatusConfirm({ isOpen: true, action: isLocked ? 'UNLOCK' : 'LOCK' })}
                                disabled={isProcessing}
                            >
                                {isLocked ? (
                                    <><Unlock className="h-4 w-4" /> Restore Access</>
                                ) : (
                                    <><ShieldAlert className="h-4 w-4" /> Restrict Access</>
                                )}
                            </Button>
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
                                <span className="text-xs font-semibold text-muted-foreground">Joined At</span>
                                <span className="text-xs font-bold text-foreground">{formatDate(user.createdAt).split(',')[0]}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/40">
                                <span className="text-xs font-semibold text-muted-foreground">Login Attempts</span>
                                <span className={cn("text-xs font-mono font-bold", user.failedLoginAttempts > 3 ? "text-destructive" : "text-foreground")}>
                                    {user.failedLoginAttempts}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-xs font-semibold text-muted-foreground">Email Status</span>
                                <span className="text-xs font-bold text-foreground">{user.emailVerified ? 'Verified' : 'Unverified'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- RIGHT: FINANCIALS & AUDIT LOGS --- */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-6 bg-emerald-500/[0.03] border-emerald-500/10 rounded-[28px] relative overflow-hidden group hover:shadow-md transition-all">
                            <TrendingUp className="absolute -bottom-2 -right-2 h-16 w-16 text-emerald-500 opacity-5 transition-transform group-hover:scale-110" />
                            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-2">Lifetime Impact</p>
                            <SmartCurrency amount={user.lifetimeImpact} currency="NGN" visible={true} size="default" className="text-emerald-700" />
                        </Card>

                        <Card className="p-6 bg-primary/5 border-primary/10 rounded-[28px] relative overflow-hidden">
                            <Heart className="absolute -bottom-2 -right-2 h-16 w-16 text-primary opacity-5" />
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-2">Contributions</p>
                            <h4 className="text-3xl font-black text-foreground tabular-nums">{user._count.donations}</h4>
                        </Card>

                        <Card className="p-6 bg-blue-500/5 border-blue-500/10 rounded-[28px] relative overflow-hidden">
                            <Activity className="absolute -bottom-2 -right-2 h-16 w-16 text-blue-500 opacity-5" />
                            <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-2">Causes Launched</p>
                            <h4 className="text-3xl font-black text-foreground tabular-nums">{user._count.projects}</h4>
                        </Card>
                    </div>

                    <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden">
                        <CardHeader className="p-6 border-b border-border/50 bg-muted/10">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-primary" /> Wallet States
                            </CardTitle>
                        </CardHeader>
                        <div className="p-0">
                            {user.wallets.length === 0 ? (
                                <div className="p-10 text-center text-xs text-muted-foreground italic">No active wallets for this entity.</div>
                            ) : user.wallets.map((w: any) => (
                                <div key={w.id} className="flex items-center justify-between p-6 border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors group">
                                    <div className="flex items-center gap-5">
                                        <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center font-black text-sm border border-border">
                                            {w.currency}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Available Balance</p>
                                            <SmartCurrency amount={w.balance} currency={w.currency} visible={true} size="default" className="text-foreground" />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">Ledger Version</p>
                                        <p className="text-xs font-mono font-bold text-foreground">V{w.version}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden">
                        <CardHeader className="p-6 border-b border-border/50 bg-muted/10">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" /> Forensic Audit Trail
                            </CardTitle>
                        </CardHeader>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/30 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b border-border/40">
                                    <tr>
                                        <th className="px-8 py-4">Action Event</th>
                                        <th className="px-6 py-4">Origin IP</th>
                                        <th className="px-8 py-4 text-right">Registered Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 text-xs">
                                    {user.auditLogs.length === 0 ? (
                                        <tr><td colSpan={3} className="p-10 text-center text-muted-foreground">No log entries found.</td></tr>
                                    ) : user.auditLogs.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-8 py-5">
                                                <Badge variant="outline" className="text-[10px] font-black uppercase rounded-lg bg-background border-border/60">
                                                    {log.action.replace(/_/g, ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5 font-mono text-xs text-muted-foreground">
                                                {log.ipAddress || 'System'}
                                            </td>
                                            <td className="px-8 py-5 text-right text-muted-foreground font-medium">
                                                {formatDate(log.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            <ConfirmModal
                isOpen={showImpersonateConfirm}
                onClose={() => setShowImpersonateConfirm(false)}
                onConfirm={onConfirmImpersonate}
                isLoading={isProcessing}
                variant="warning"
                title="Establish Forensic Proxy"
                description={`You are about to launch a forensic perspective for ${user.email}. You will view the platform exactly as they do. All actions are logged under your administrative identity.`}
                confirmText="Establish Proxy"
            />

            <ConfirmModal
                isOpen={statusConfirm.isOpen}
                onClose={() => setStatusConfirm({ isOpen: false, action: null })}
                onConfirm={onConfirmStatusToggle}
                isLoading={isProcessing}
                variant={statusConfirm.action === 'LOCK' ? 'destructive' : 'warning'}
                title={statusConfirm.action === 'LOCK' ? 'Restrict Access' : 'Restore Access'}
                description={statusConfirm.action === 'LOCK'
                    ? `Are you sure you want to restrict all access for ${user.email}? This will terminate active sessions and prevent further ledger interaction.`
                    : `Restore global platform access for ${user.email}?`
                }
                confirmText={statusConfirm.action === 'LOCK' ? 'Lock Account' : 'Unlock Account'}
            />
        </>
    );
}