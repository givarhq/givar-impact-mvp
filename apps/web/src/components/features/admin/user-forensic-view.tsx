'use client';

import React, { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Wallet, Lock, Unlock, ShieldAlert, History, Loader2, Fingerprint,
    UserCheck, UserSearch, Shield, ShieldOff
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
import { motion } from 'framer-motion';

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

export const UserForensicView = memo(function UserForensicView({ user }: UserForensicViewProps) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    const [showImpersonateConfirm, setShowImpersonateConfirm] = useState(false);
    const [statusConfirm, setStatusConfirm] = useState<{ isOpen: boolean; action: 'LOCK' | 'UNLOCK' | null }>({
        isOpen: false,
        action: null
    });
    const [roleConfirm, setRoleConfirm] = useState<{ isOpen: boolean; action: 'PROMOTE' | 'DEMOTE' | null }>({
        isOpen: false,
        action: null
    });

    const isLocked = !!user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date();
    const isAdmin = user.role === 'ADMIN';
    const isSuperAdmin = user.role === 'SUPERADMIN';

    const onConfirmImpersonate = async () => {
        setIsProcessing(true);
        const toastId = toast.loading("Establishing Forensic Proxy...");
        try {
            const currentToken = getCookie('givar_token');
            const currentUser = getCookie('givar_user');

            const response = await ApiService.admin.impersonate(user.id);

            setCookie('givar_admin_backup_token', currentToken, { path: '/' });
            setCookie('givar_admin_backup_user', currentUser, { path: '/' });

            setCookie('givar_token', response.accessToken, { path: '/' });
            setCookie('givar_user', JSON.stringify(response.user), { path: '/' });
            setCookie('givar_is_impersonating', 'true', { path: '/' });

            toast.success(`Forensic Proxy Active`, { id: toastId });
            window.location.href = '/dashboard';
        } catch (e) {
            toast.error('Forensic Session Failed', { id: toastId });
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
            toast.success(`User Status Updated`);
            setStatusConfirm({ isOpen: false, action: null });
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Action Failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const onConfirmRoleChange = async () => {
        const action = roleConfirm.action;
        if (!action) return;

        setIsProcessing(true);
        try {
            const newRole = action === 'PROMOTE' ? 'ADMIN' : 'USER';
            await ApiService.admin.updateUserRole(user.id, newRole);
            toast.success(`Role Updated`);
            setRoleConfirm({ isOpen: false, action: null });
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Role Change Failed");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start"
            >
                <div className="lg:col-span-4 space-y-4 md:space-y-6">
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <div className="p-6 text-center space-y-4">
                            <div className="relative inline-block">
                                <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-primary text-2xl font-bold border border-primary/10 mx-auto">
                                    {user.firstName[0]}{user.lastName[0]}
                                </div>
                                <div className={cn(
                                    "absolute -bottom-1 -right-1 h-8 w-8 rounded-3xl border-4 border-card flex items-center justify-center shadow-sm",
                                    isLocked ? "bg-destructive text-white" : "bg-emerald-500 text-white"
                                )}>
                                    {isLocked ? <Lock className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                </div>
                            </div>

                            <div className="space-y-0.5">
                                <h2 className="text-xl font-bold tracking-tight text-foreground">{user.firstName} {user.lastName}</h2>
                                <p className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded-3xl inline-block truncate max-w-full">
                                    {user.id}
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-1.5">
                                <Badge variant="outline" className={cn(
                                    "rounded-3xl px-2 py-0.5 text-xs font-bold border-border/40",
                                    isAdmin || isSuperAdmin ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-muted/30"
                                )}>
                                    {user.role}
                                </Badge>
                                <Badge variant="outline" className="rounded-3xl bg-muted/30 px-2 py-0.5 text-xs font-bold border-border/40">
                                    {user.accountType}
                                </Badge>
                                {user.emailVerified && (
                                    <Badge className="rounded-3xl bg-emerald-50 text-emerald-600 border-emerald-100 text-xs font-bold">
                                        Verified
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <CardContent className="p-5 pt-0 space-y-2">
                            {!isSuperAdmin && (
                                <div className="flex justify-center">
                                    <Button
                                        className="w-full max-w-[48rem] h-10 rounded-3xl font-bold text-xs gap-2"
                                        onClick={() => setShowImpersonateConfirm(true)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing
                                            ? <Loader2 className="animate-spin h-3.5 w-3.5" />
                                            : <UserSearch className="h-3.5 w-3.5" />}
                                        View Perspective
                                    </Button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                {!isSuperAdmin && (
                                    <Button
                                        variant="outline"
                                        className="h-10 rounded-3xl font-bold text-xs gap-2 border-border/60"
                                        onClick={() => setRoleConfirm({ isOpen: true, action: isAdmin ? 'DEMOTE' : 'PROMOTE' })}
                                        disabled={isProcessing}
                                    >
                                        {isAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                                        Role
                                    </Button>
                                )}

                                <Button
                                    variant={isLocked ? "default" : "destructive"}
                                    className={cn(
                                        "h-10 rounded-3xl font-bold text-xs gap-2 border-0",
                                        !isLocked && "bg-destructive/10 text-destructive hover:bg-destructive",
                                        isSuperAdmin && "col-span-2"
                                    )}
                                    onClick={() => setStatusConfirm({ isOpen: true, action: isLocked ? 'UNLOCK' : 'LOCK' })}
                                    disabled={isProcessing || isSuperAdmin}
                                >
                                    {isLocked ? <Unlock className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                                    Status
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-3 px-5">
                            <CardTitle className="text-xs font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                                <Fingerprint className="h-3.5 w-3.5" /> Account Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-muted-foreground">Registration</span>
                                <span className="font-bold text-foreground">{formatDate(user.createdAt).split(',')[0]}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-muted-foreground">Failed Logins</span>
                                <span className={cn("font-bold tabular-nums", user.failedLoginAttempts > 2 ? "text-destructive" : "text-foreground")}>
                                    {user.failedLoginAttempts}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-muted-foreground">Email Status</span>
                                <span className="font-bold text-foreground">{user.emailVerified ? 'Verified' : 'Pending'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-8 space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-3xl">
                            <p className="text-xs font-bold text-emerald-600 tracking-widest mb-1.5">Total Impact</p>
                            <SmartCurrency amount={user.lifetimeImpact} currency="NGN" visible={true} size="default" className="text-emerald-700" />
                        </div>

                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-3xl">
                            <p className="text-xs font-bold text-primary tracking-widest mb-1.5">Contributions</p>
                            <h4 className="text-xl font-bold text-foreground tabular-nums">{user._count.donations}</h4>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-3xl">
                            <p className="text-xs font-bold text-blue-600 tracking-widest mb-1.5">Live Causes</p>
                            <h4 className="text-xl font-bold text-foreground tabular-nums">{user._count.projects}</h4>
                        </div>
                    </div>

                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="p-4 md:px-6 border-b border-border/40 bg-muted/10">
                            <CardTitle className="text-xs font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                                <Wallet className="h-3.5 w-3.5" /> Ledger Info
                            </CardTitle>
                        </CardHeader>
                        <div className="p-0">
                            {user.wallets.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground italic">No wallet nodes identified.</div>
                            ) : user.wallets.map((w: any) => (
                                <div key={w.id} className="flex items-center justify-between p-4 md:px-6 border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-3xl bg-background border border-border/40 flex items-center justify-center font-bold text-xs text-foreground">
                                            {w.currency}
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[11px] font-bold text-muted-foreground tracking-widest">Current Balance</p>
                                            <SmartCurrency amount={w.balance} currency={w.currency} visible={true} size="small" className="text-foreground" />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-bold text-muted-foreground">Version</p>
                                        <p className="text-xs font-mono font-bold text-foreground">v{w.version}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="p-4 md:px-6 border-b border-border/40 bg-muted/10">
                            <CardTitle className="text-xs font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                                <History className="h-3.5 w-3.5" /> Audit Trail
                            </CardTitle>
                        </CardHeader>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/40 text-[11px] font-bold tracking-widest text-muted-foreground border-b border-border/40">
                                    <tr>
                                        <th className="px-6 py-3">Event</th>
                                        <th className="px-6 py-3">IP Address</th>
                                        <th className="px-6 py-3 text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 text-xs font-medium">
                                    {user.auditLogs.length === 0 ? (
                                        <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No entries found.</td></tr>
                                    ) : user.auditLogs.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="text-xs font-bold rounded-3xl bg-background border-border/60">
                                                    {log.action.replace(/_/g, ' ').toLowerCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-muted-foreground">
                                                {log.ipAddress || 'system'}
                                            </td>
                                            <td className="px-6 py-4 text-right text-muted-foreground tabular-nums">
                                                {formatDate(log.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </motion.div>

            <ConfirmModal
                isOpen={showImpersonateConfirm}
                onClose={() => setShowImpersonateConfirm(false)}
                onConfirm={onConfirmImpersonate}
                isLoading={isProcessing}
                variant="warning"
                title="Initialize Proxy"
                description={`Establish a support session for ${user.email}. You will view the account state exactly as the user does. All actions are audited.`}
                confirmText="Start Session"
            />

            <ConfirmModal
                isOpen={statusConfirm.isOpen}
                onClose={() => setStatusConfirm({ isOpen: false, action: null })}
                onConfirm={onConfirmStatusToggle}
                isLoading={isProcessing}
                variant={statusConfirm.action === 'LOCK' ? 'destructive' : 'default'}
                title={statusConfirm.action === 'LOCK' ? 'Restrict Access' : 'Restore Access'}
                description={statusConfirm.action === 'LOCK'
                    ? `Terminate active sessions & restrict platform access for ${user.email}?`
                    : `Restore full ledger & identity access for ${user.email}?`
                }
                confirmText={statusConfirm.action === 'LOCK' ? 'Lock Account' : 'Unlock Account'}
            />

            <ConfirmModal
                isOpen={roleConfirm.isOpen}
                onClose={() => setRoleConfirm({ isOpen: false, action: null })}
                onConfirm={onConfirmRoleChange}
                isLoading={isProcessing}
                variant={roleConfirm.action === 'DEMOTE' ? 'destructive' : 'warning'}
                title={roleConfirm.action === 'PROMOTE' ? 'Grant Admin Rights' : 'Revoke Admin Rights'}
                description={roleConfirm.action === 'PROMOTE'
                    ? "Elevate this account to administrative status? This provides access to forensic tools & user management."
                    : "Demote this account to standard user status? All administrative permissions will be revoked."
                }
                confirmText={roleConfirm.action === 'PROMOTE' ? 'Promote' : 'Demote'}
            />
        </>
    );
});