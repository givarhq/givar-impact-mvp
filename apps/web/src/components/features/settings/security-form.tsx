'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Loader2, ShieldCheck, Lock, Eye, EyeOff,
    ShieldAlert, Fingerprint, KeyRound, Check,
    AlertCircle
} from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { ApiService } from '../../../services/api';
import { TwoFactorSetup } from './two-factor-setup';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';

const securitySchema = z.object({
    currentPassword: z.string().min(1, "Your current password is required to verify identity"),
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Requires at least one uppercase letter")
        .regex(/[0-9]/, "Requires at least one numerical digit")
        .regex(/[^A-Za-z0-9]/, "Requires at least one special symbol"),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
});

type SecurityFormValues = z.infer<typeof securitySchema>;

export function SecurityForm({ user }: { user: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isDirty },
        reset
    } = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema),
        mode: 'onChange'
    });

    const newPassword = watch('newPassword', '');

    const strengthCriteria = [
        { label: "8+ characters", met: newPassword.length >= 8 },
        { label: "Uppercase letter", met: /[A-Z]/.test(newPassword) },
        { label: "Number", met: /[0-9]/.test(newPassword) },
        { label: "Special symbol", met: /[^A-Za-z0-9]/.test(newPassword) },
    ];

    const strengthScore = strengthCriteria.filter(c => c.met).length;

    const onSubmit = async (data: SecurityFormValues) => {
        setIsLoading(true);
        const toastId = toast.loading("Verifying and updating credentials...");

        try {
            await ApiService.auth.updatePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });

            toast.success("Security credentials updated", { id: toastId });
            reset(); // Clear all fields after success
        } catch (error: any) {
            const message = error.response?.data?.message || "Verification failed. Check your current password.";
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 1. Two-Factor Authentication Management */}
            <TwoFactorSetup isEnabled={user.twoFactorEnabled} />

            {/* 2. Credential Rotation Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden">
                    <CardContent className="p-8 md:p-10 space-y-8">

                        {/* Header Header */}
                        <div className="flex items-center justify-between border-b border-border/40 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20">
                                    <KeyRound className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">Credential Rotation</h3>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Protect your impact wallet nodes</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPasswords(!showPasswords)}
                                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/50 rounded-xl h-9"
                            >
                                {showPasswords ? <EyeOff className="h-3.5 w-3.5 mr-2" /> : <Eye className="h-3.5 w-3.5 mr-2" />}
                                {showPasswords ? 'Hide sensitive data' : 'Reveal data'}
                            </Button>
                        </div>

                        <div className="space-y-8">
                            {/* Current Pass Verification */}
                            <div className="space-y-2">
                                <Input
                                    label="Current Ledger Password"
                                    type={showPasswords ? "text" : "password"}
                                    {...register('currentPassword')}
                                    error={errors.currentPassword?.message}
                                    placeholder="Required to verify ownership"
                                    className="h-12"
                                />
                            </div>

                            <div className="h-px bg-border/40 w-1/3 mx-auto" />

                            {/* New Password Logic */}
                            <div className="space-y-6">
                                <Input
                                    label="New Secure Password"
                                    type={showPasswords ? "text" : "password"}
                                    {...register('newPassword')}
                                    error={errors.newPassword?.message}
                                    placeholder="Minimum 8 complex characters"
                                    className="h-12"
                                />

                                {/* Strength Meter Module */}
                                <div className="space-y-4 p-5 rounded-[24px] bg-muted/20 border border-border/50 shadow-inner">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Complexity Protocol</span>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                            strengthScore <= 2 ? "text-destructive bg-destructive/10" :
                                                strengthScore === 3 ? "text-amber-600 bg-amber-500/10" :
                                                    "text-emerald-600 bg-emerald-500/10"
                                        )}>
                                            {strengthScore === 0 ? "Empty" : strengthScore <= 2 ? "Vulnerable" : strengthScore === 3 ? "Acceptable" : "Immutable Strength"}
                                        </span>
                                    </div>

                                    <div className="flex gap-2 h-1.5">
                                        {[1, 2, 3, 4].map((step) => (
                                            <div
                                                key={step}
                                                className={cn(
                                                    "flex-1 rounded-full transition-all duration-700",
                                                    step <= strengthScore
                                                        ? (strengthScore <= 2 ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.3)]" :
                                                            strengthScore === 3 ? "bg-amber-500" :
                                                                "bg-primary shadow-[0_0_10px_rgba(16,185,129,0.3)]")
                                                        : "bg-border/60"
                                                )}
                                            />
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 pt-1">
                                        {strengthCriteria.map((c, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className={cn(
                                                    "h-4 w-4 rounded-full flex items-center justify-center border transition-all duration-300",
                                                    c.met ? "bg-primary border-primary text-white scale-110" : "bg-transparent border-border/60 text-transparent"
                                                )}>
                                                    <Check className="h-2.5 w-2.5" />
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-bold tracking-tight uppercase transition-colors duration-300",
                                                    c.met ? "text-foreground" : "text-muted-foreground/40"
                                                )}>
                                                    {c.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Input
                                    label="Confirm New Password"
                                    type={showPasswords ? "text" : "password"}
                                    {...register('confirmPassword')}
                                    error={errors.confirmPassword?.message}
                                    placeholder="Re-enter to match"
                                    className="h-12"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-start gap-4 p-6 rounded-3xl bg-amber-500/[0.03] border border-amber-500/10">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">Security Notice</p>
                        <p className="text-[11px] text-amber-700/80 leading-relaxed font-medium">
                            Credential rotation requires a fresh ledger entry. This action will terminate all other active sessions to ensure global account synchronisation.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        type="submit"
                        disabled={isLoading || !isDirty || strengthScore < 4}
                        className="h-16 rounded-[24px] px-10 font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all gap-3"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                        Confirm Credential Update
                    </Button>
                </div>
            </form>
        </div>
    );
}