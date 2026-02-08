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
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TwoFactorSetup isEnabled={user.twoFactorEnabled} />

            <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div
                        onClick={() => !isEditing && setIsEditing(true)}
                        className={cn(
                            "p-8 transition-all group",
                            isEditing ? "bg-primary/[0.01]" : "hover:bg-muted/30 cursor-pointer"
                        )}
                    >
                        <div className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-5 flex-1 min-w-0">
                                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20">
                                    <KeyRound className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg text-foreground">Password Management</h3>
                                    {!isEditing && <p className="text-sm text-muted-foreground font-medium">Update your password</p>}
                                </div>
                            </div>
                            {!isEditing && <ChevronRight className="h-5 w-5 shrink-0 ml-4 text-muted-foreground opacity-30 group-hover:opacity-100 transition-all" />}
                        </div>

                        {isEditing && (
                            <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-8 animate-in slide-in-from-top-4" onClick={(e) => e.stopPropagation()}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <Input
                                            label="Current Password"
                                            type={showPasswords ? "text" : "password"}
                                            {...register('currentPassword')}
                                            error={errors.currentPassword?.message}
                                            placeholder="Verify current password"
                                            className="h-12"
                                            rightElement={
                                                <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="text-muted-foreground hover:text-foreground">
                                                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            }
                                        />
                                        <Input label="New Password" type={showPasswords ? "text" : "password"} {...register('newPassword')} error={errors.newPassword?.message} placeholder="Min. 8 characters" className="h-12" />
                                        <Input label="Confirm New Password" type={showPasswords ? "text" : "password"} {...register('confirmPassword')} error={errors.confirmPassword?.message} placeholder="Repeat new password" className="h-12" />
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 rounded-[24px] bg-muted/20 border border-border/50 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entropy Strength</span>
                                                <span className={cn("text-[10px] font-bold uppercase", strengthScore < 3 ? "text-destructive" : "text-emerald-500")}>
                                                    {strengthScore < 3 ? 'Weak' : 'Secure'}
                                                </span>
                                            </div>
                                            <div className="flex gap-1.5 h-1.5">
                                                {[1, 2, 3, 4].map(s => (
                                                    <div key={s} className={cn("flex-1 rounded-full transition-all duration-500", s <= strengthScore ? (strengthScore < 3 ? "bg-destructive" : "bg-primary") : "bg-muted-foreground/10")} />
                                                ))}
                                            </div>
                                            <div className="space-y-2 pt-2">
                                                <p className="text-[10px] text-muted-foreground leading-relaxed flex items-start gap-2">
                                                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                                    Updating your password will log you out of all other active sessions for security.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button type="submit" disabled={isLoading || strengthScore < 4} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-2">
                                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                                Update Password
                                            </Button>
                                            <Button type="button" variant="outline" className="h-14 w-14 rounded-2xl border-border/60" onClick={() => { setIsEditing(false); reset(); }}><X className="h-5 w-5" /></Button>
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