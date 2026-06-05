'use client';

import React, { useState, memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Lock, Unlock, ShieldAlert, History, Loader2, Fingerprint,
    UserCheck, UserSearch, Shield, CheckCircle2, Clock,
    ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { SmartCurrency } from '../../ui/smart-currency';
import { ConfirmModal } from '../../ui/confirm-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Input } from '../../ui/input';
import { formatDate } from '../../../lib/utils/format';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getCookie } from 'cookies-next';

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
        avatarUrl?: string;
        organization?: {
            status: string;
            legalName: string;
            kycType: string;
        } | null;
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

    const [roleModal, setRoleModal] = useState<{ isOpen: boolean; targetRole: string | null }>({
        isOpen: false,
        targetRole: null
    });
    const [stepUpTotp, setStepUpTotp] = useState('');

    const [currentUserRole, setCurrentUserRole] = useState('ADMIN');
    const [currentUserId, setCurrentUserId] = useState('');

    useEffect(() => {
        const currentUserCookie = getCookie('givar_user');
        if (currentUserCookie) {
            try {
                const parsed = JSON.parse(currentUserCookie as string);
                setCurrentUserRole(parsed.role);
                setCurrentUserId(parsed.id);
            } catch (e) { }
        }
    }, []);

    const isLocked = !!user.accountLockedUntil && new Date(user.accountLockedUntil) > new Date();
    const targetIsAdmin = user.role === 'ADMIN';
    const targetIsSuperAdmin = user.role === 'SUPERADMIN';
    const isSystemUser = targetIsAdmin || targetIsSuperAdmin;

    const isViewerSuperAdmin = currentUserRole === 'SUPERADMIN';
    const isViewingSelf = currentUserId === user.id;

    const onConfirmImpersonate = async () => {
        setIsProcessing(true);
        const toastId = toast.loading("Establishing proxy...");
        try {
            const response = await ApiService.admin.impersonate(user.id);

            await fetch('/api/auth/clear-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'impersonate',
                    token: response.accessToken,
                    user: response.user
                })
            });

            toast.success(`Proxy active`, { id: toastId });
            window.location.href = '/dashboard';
        } catch (e) {
            toast.error('Session failed', { id: toastId });
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
            toast.success(`User status updated`);
            setStatusConfirm({ isOpen: false, action: null });
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Action failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const onConfirmRoleChange = async () => {
        if (!roleModal.targetRole) return;

        const requiresPassword = roleModal.targetRole === 'SUPERADMIN' || user.role === 'SUPERADMIN';
        if (requiresPassword && !stepUpTotp) {
            return toast.error("Authenticator code is required for root access modifications.");
        }

        setIsProcessing(true);
        const toastId = toast.loading("Processing clearance level change...");
        try {
            await ApiService.admin.updateUserRole(user.id, {
                role: roleModal.targetRole,
                totpCode: stepUpTotp || undefined
            });
            toast.success(`Clearance level updated successfully`, { id: toastId });
            setRoleModal({ isOpen: false, targetRole: null });
            setStepUpTotp('');
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Clearance update failed", { id: toastId });
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
                                {user.avatarUrl ? (
                                    <div className="relative h-20 w-20 rounded-full border border-border/40 shadow-inner mx-auto overflow-hidden bg-muted">
                                        <Image src={user.avatarUrl} fill sizes="80px" className="object-cover" alt="" />
                                    </div>
                                ) : (
                                    <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-primary text-2xl font-bold border border-primary/10 mx-auto">
                                        {user.firstName[0]}{user.lastName[0]}
                                    </div>
                                )}
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
                                    targetIsSuperAdmin ? "bg-purple-50 text-purple-600 border-purple-100" : targetIsAdmin ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-muted/30"
                                )}>
                                    {user.role}
                                </Badge>
                                <Badge variant="outline" className="rounded-3xl bg-muted/30 px-2 py-0.5 text-xs font-bold border-border/40">
                                    {user.accountType}
                                </Badge>

                                {user.organization?.status === 'VERIFIED' && (
                                    <Badge className="rounded-3xl bg-emerald-50 text-emerald-600 border-emerald-100 text-xs font-bold gap-1 shadow-none">
                                        <ShieldCheck className="h-3 w-3" /> KYC Verified
                                    </Badge>
                                )}
                                {user.organization?.status === 'PENDING' && (
                                    <Badge className="rounded-3xl bg-amber-50 text-amber-600 border-amber-100 text-xs font-bold gap-1 animate-pulse shadow-none">
                                        <Clock className="h-3 w-3" /> KYC Pending
                                    </Badge>
                                )}
                                {user.organization?.status === 'REJECTED' && (
                                    <Badge className="rounded-3xl bg-destructive/10 text-destructive border-destructive/20 text-xs font-bold gap-1 shadow-none">
                                        <ShieldAlert className="h-3 w-3" /> KYC Rejected
                                    </Badge>
                                )}
                                {user.emailVerified && user.organization?.status !== 'VERIFIED' && (
                                    <Badge className="rounded-3xl bg-blue-50 text-blue-600 border-blue-100 text-xs font-bold gap-1 shadow-none">
                                        <CheckCircle2 className="h-3 w-3" /> Email Verified
                                    </Badge>
                                )}
                                {!user.emailVerified && (
                                    <Badge className="rounded-3xl bg-muted/50 text-muted-foreground border-border/40 text-xs font-bold gap-1 shadow-none">
                                        <Clock className="h-3 w-3" /> Unverified
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <CardContent className="p-5 pt-0 space-y-2">
                            {!targetIsSuperAdmin && (
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
                                {isViewerSuperAdmin && !isViewingSelf && (
                                    <Button
                                        variant="outline"
                                        className="h-10 rounded-3xl font-bold text-xs gap-2 border-border/60"
                                        onClick={() => setRoleModal({ isOpen: true, targetRole: user.role })}
                                        disabled={isProcessing}
                                    >
                                        <Shield className="h-3.5 w-3.5" />
                                        Access Level
                                    </Button>
                                )}

                                <Button
                                    variant={isLocked ? "default" : "destructive"}
                                    className={cn(
                                        "h-10 rounded-3xl font-bold text-xs gap-2 border-0",
                                        !isLocked && "bg-destructive/10 text-destructive hover:bg-destructive",
                                        (!isViewerSuperAdmin || isViewingSelf) && "col-span-2"
                                    )}
                                    onClick={() => setStatusConfirm({ isOpen: true, action: isLocked ? 'UNLOCK' : 'LOCK' })}
                                    disabled={isProcessing || targetIsSuperAdmin || isViewingSelf}
                                >
                                    {isLocked ? <Unlock className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                                    Status
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-3 px-5">
                            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2">
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
                                <span className="font-medium text-muted-foreground">Identity Profile</span>
                                <span className="font-bold text-foreground">{user.organization?.status || 'NOT SUBMITTED'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-8 space-y-4 md:space-y-6">
                    {!isSystemUser && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-4 bg-card border border-border/40 rounded-3xl shadow-sm">
                                <p className="text-xs font-bold text-muted-foreground mb-1.5">Total Impact</p>
                                <SmartCurrency amount={user.lifetimeImpact} currency="NGN" visible={true} size="default" className="text-foreground" />
                            </div>

                            <div className="p-4 bg-card border border-border/40 rounded-3xl shadow-sm">
                                <p className="text-xs font-bold text-muted-foreground mb-1.5">Contributions</p>
                                <h4 className="text-xl font-bold text-foreground tabular-nums">{user._count.donations}</h4>
                            </div>

                            <div className="p-4 bg-card border border-border/40 rounded-3xl shadow-sm">
                                <p className="text-xs font-bold text-muted-foreground mb-1.5">Live Causes</p>
                                <h4 className="text-xl font-bold text-foreground tabular-nums">{user._count.projects}</h4>
                            </div>
                        </div>
                    )}

                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardHeader className="p-4 md:px-6 border-b border-border/40 bg-muted/10">
                            <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                <History className="h-3.5 w-3.5" /> Audit Trail
                            </CardTitle>
                        </CardHeader>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/40 text-[11px] font-bold text-muted-foreground border-b border-border/40">
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

            <Dialog open={roleModal.isOpen} onOpenChange={(isOpen) => !isOpen && setRoleModal({ isOpen: false, targetRole: null })}>
                <DialogContent className="rounded-3xl border-none shadow-2xl bg-card p-6 md:p-8 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">Manage Access Level</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 pt-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground ml-1">Select new role</label>
                            <Select
                                value={roleModal.targetRole || user.role}
                                onValueChange={(v) => setRoleModal(prev => ({ ...prev, targetRole: v }))}
                                disabled={isProcessing}
                            >
                                <SelectTrigger className="h-11 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm font-bold shadow-inner">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-xl border-border/40">
                                    <SelectItem value="USER" className="text-xs font-bold py-2.5">User (Standard)</SelectItem>
                                    <SelectItem value="ADMIN" className="text-xs font-bold py-2.5 text-blue-600">Admin</SelectItem>
                                    <SelectItem value="SUPERADMIN" className="text-xs font-bold py-2.5 text-purple-600">Super Admin (Root)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <AnimatePresence>
                            {(roleModal.targetRole === 'SUPERADMIN' || user.role === 'SUPERADMIN') && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-3 overflow-hidden"
                                >
                                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 shadow-inner mt-2">
                                        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                                            Root elevation or demotion requires cryptographic verification. Enter your authenticator code to proceed.
                                        </p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-muted-foreground ml-1">Step-up authorization</label>
                                        <Input
                                            type="text"
                                            maxLength={8}
                                            placeholder="000000"
                                            value={stepUpTotp}
                                            onChange={(e) => setStepUpTotp(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                                            className="h-11 rounded-2xl bg-muted/20 border-border/60 focus:bg-background shadow-inner text-center tracking-[0.5em] font-bold text-lg uppercase"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-2 pt-2 border-t border-border/40">
                            <Button
                                variant="ghost"
                                onClick={() => { setRoleModal({ isOpen: false, targetRole: null }); setStepUpTotp(''); }}
                                disabled={isProcessing}
                                className="flex-1 rounded-3xl font-bold text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={onConfirmRoleChange}
                                disabled={isProcessing || !roleModal.targetRole || roleModal.targetRole === user.role}
                                className="flex-1 rounded-3xl font-bold text-xs shadow-md border-0 bg-primary text-white hover:bg-primary/90"
                            >
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm changes"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                    : `Restore full access for ${user.email}?`
                }
                confirmText={statusConfirm.action === 'LOCK' ? 'Lock Account' : 'Unlock Account'}
            />
        </>
    );
});