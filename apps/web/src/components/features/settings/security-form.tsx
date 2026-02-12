'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Loader2, ShieldCheck, KeyRound, Check, X,
    ChevronRight, ShieldAlert, Lock, Eye, EyeOff,
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
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string()
        .min(8, "Min 8 characters")
        .regex(/[A-Z]/, "Requires uppercase")
        .regex(/[0-9]/, "Requires a digit")
        .regex(/[^A-Za-z0-9]/, "Requires a symbol"),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mismatch",
    path: ["confirmPassword"],
});

type SecurityFormValues = z.infer<typeof securitySchema>;

export function SecurityForm({ user }: { user: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        reset
    } = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema),
        mode: 'onChange'
    });

    const newPassword = watch('newPassword', '');
    const strengthScore = [
        newPassword.length >= 8,
        /[A-Z]/.test(newPassword),
        /[0-9]/.test(newPassword),
        /[^A-Za-z0-9]/.test(newPassword)
    ].filter(Boolean).length;

    const onSubmit = async (data: SecurityFormValues) => {
        setIsLoading(true);
        try {
            await ApiService.auth.updatePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });
            toast.success("Security credentials updated");
            setIsEditing(false);
            reset();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Verification failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 focus-visible:outline-none outline-none">
            <TwoFactorSetup isEnabled={user.twoFactorEnabled} />

            <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden focus-visible:outline-none outline-none">
                <CardContent className="p-0">
                    <div
                        onClick={() => !isEditing && setIsEditing(true)}
                        className={cn(
                            "p-5 md:p-6 transition-all group",
                            isEditing ? "bg-primary/[0.01]" : "hover:bg-muted/30 cursor-pointer"
                        )}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={cn(
                                    "h-10 w-10 rounded-3xl flex items-center justify-center border transition-colors",
                                    isEditing ? "bg-primary/10 border-primary/20 text-primary" : "bg-amber-500/10 border-amber-500/20 text-amber-600"
                                )}>
                                    <KeyRound className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <h3 className="font-bold text-sm text-foreground">Password Management</h3>
                                    {!isEditing && <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Update security credentials</p>}
                                </div>
                            </div>
                            {!isEditing && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 group-hover:opacity-100 transition-all" />}
                        </div>

                        {isEditing && (
                            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <Input
                                            label="Current Password"
                                            type={showPasswords ? "text" : "password"}
                                            {...register('currentPassword')}
                                            error={errors.currentPassword?.message}
                                            placeholder="Verify identity"
                                            className="h-10 rounded-3xl"
                                            rightElement={
                                                <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="text-muted-foreground hover:text-foreground outline-none">
                                                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            }
                                        />
                                        <Input label="New Password" type={showPasswords ? "text" : "password"} {...register('newPassword')} error={errors.newPassword?.message} placeholder="Min. 8 characters" className="h-10 rounded-3xl" />
                                        <Input label="Confirm New Password" type={showPasswords ? "text" : "password"} {...register('confirmPassword')} error={errors.confirmPassword?.message} placeholder="Repeat new password" className="h-10 rounded-3xl" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-5 rounded-3xl bg-muted/20 border border-border/50 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Security Strength</span>
                                                <span className={cn("text-xs font-bold uppercase", strengthScore < 4 ? "text-destructive" : "text-emerald-600")}>
                                                    {strengthScore < 4 ? 'Insufficient' : 'Secure'}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 h-1">
                                                {[1, 2, 3, 4].map(s => (
                                                    <div key={s} className={cn("flex-1 rounded-3xl transition-all duration-500", s <= strengthScore ? (strengthScore < 4 ? "bg-destructive" : "bg-primary") : "bg-muted-foreground/10")} />
                                                ))}
                                            </div>
                                            <div className="pt-2">
                                                <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2 italic">
                                                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0 opacity-50" />
                                                    Note: Password rotation will terminate all other active ledger sessions.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button type="submit" disabled={isLoading || strengthScore < 4} className="flex-1 h-11 rounded-3xl font-bold text-xs uppercase tracking-widest gap-2 shadow-sm border-0">
                                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                                Update Credentials
                                            </Button>
                                            <Button type="button" variant="outline" className="h-11 w-11 rounded-3xl border-border/60 shrink-0" onClick={() => { setIsEditing(false); reset(); }}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}