'use client';

import React, { useState, useEffect, memo } from 'react';
import {
    Trash2, Loader2, ShieldAlert, XCircle,
    AlertCircle, Eye, EyeOff, Lock
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';
import { OtpInput } from '../../ui/otp-input';
import { getCookie } from 'cookies-next';

interface DangerZoneProps {
    user?: any;
}

export const DangerZone = memo(function DangerZone({ user }: DangerZoneProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [totpCode, setTotpCode] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(user || null);

    useEffect(() => {
        if (!user) {
            const userCookie = getCookie('givar_user');
            if (userCookie) {
                try {
                    setCurrentUser(JSON.parse(userCookie as string));
                } catch (e) { }
            }
        }
    }, [user]);

    const has2FA = currentUser?.twoFactorEnabled ?? false;

    const handleDelete = async () => {
        if (has2FA && !totpCode) {
            return toast.error("Authentication code required to authorize deletion");
        }
        if (!has2FA && !password.trim()) {
            return toast.error("Please enter your password to confirm deletion");
        }

        setIsLoading(true);
        try {
            const payload = has2FA
                ? { totpCode }
                : { password: password.trim() };

            await ApiService.auth.deleteAccount(payload);
            toast.success("Account successfully deleted");
            window.location.href = '/api/auth/clear-session?reason=account_deleted';
        } catch (error: any) {
            const message = error.response?.data?.message || "Deletion failed. Please verify your credentials.";
            toast.error(message);
            setIsLoading(false);
        }
    };

    return (
        <div className="pt-6 border-t border-border/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6 rounded-3xl bg-destructive/5 border border-destructive/10 shadow-sm">
                <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-destructive flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" /> Danger Zone
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium max-w-lg leading-relaxed">
                        Permanently remove your account and data. This action is irreversible. Historical donation records are preserved for ledger transparency.
                    </p>
                </div>
                <Button
                    variant="destructive"
                    onClick={() => {
                        setTotpCode('');
                        setPassword('');
                        setIsDialogOpen(true);
                    }}
                    className="h-10 rounded-3xl px-6 font-bold text-xs shadow-sm active:scale-95 transition-all"
                >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Account
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card max-w-md w-[calc(100vw-2rem)]">
                    <div className="p-6 sm:p-8 space-y-6 flex flex-col items-center text-center w-full">
                        <div className="flex flex-col items-center text-center space-y-2 w-full">
                            <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-1">
                                <XCircle className="h-6 w-6" />
                            </div>
                            <DialogHeader className="w-full text-center flex flex-col items-center">
                                <DialogTitle className="text-xl font-bold tracking-tight text-center text-foreground">
                                    Delete Account
                                </DialogTitle>
                            </DialogHeader>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                                {has2FA
                                    ? "Enter your authenticator code or emergency recovery code to authorize account deletion."
                                    : "Enter your password to confirm permanent account removal."}
                            </p>
                        </div>

                        <div className="space-y-4 w-full">
                            {has2FA ? (
                                <>
                                    {!useRecoveryCode ? (
                                        <div className="space-y-3 w-full">
                                            <label className="text-xs font-bold text-foreground text-center block">Enter the 6-digit code</label>
                                            <OtpInput
                                                value={totpCode}
                                                onChange={setTotpCode}
                                                maxLength={6}
                                                disabled={isLoading}
                                                className="gap-1.5 sm:gap-2.5 justify-center"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-3 w-full">
                                            <label className="text-xs font-bold text-foreground text-center block">Enter recovery code</label>
                                            <Input
                                                type="text"
                                                placeholder="e.g. A1B2C3D4"
                                                maxLength={8}
                                                value={totpCode}
                                                onChange={(e) => setTotpCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
                                                className="h-12 rounded-2xl bg-muted/20 text-center font-bold tracking-[0.4em] text-base uppercase shadow-inner w-full"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-center pt-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUseRecoveryCode(!useRecoveryCode);
                                                setTotpCode('');
                                            }}
                                            className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors outline-none"
                                        >
                                            {useRecoveryCode ? "Use authenticator app instead" : "Use an emergency recovery code"}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2 text-left w-full">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Current password</label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isLoading}
                                            className="h-12 rounded-2xl bg-muted/20 text-sm w-full pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground outline-none"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 text-xs text-amber-800 leading-relaxed flex items-start gap-2.5 text-left w-full">
                                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <span>Note: Accounts with active projects cannot be deleted to preserve donor trust and public ledger history.</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={isLoading}
                                className="rounded-full h-11 text-xs font-bold border-border/60"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isLoading || (has2FA ? (!useRecoveryCode ? totpCode.length !== 6 : totpCode.length !== 8) : !password.trim())}
                                className="rounded-full h-11 font-bold text-xs shadow-md border-0 active:scale-95 transition-all"
                            >
                                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Deletion'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
});