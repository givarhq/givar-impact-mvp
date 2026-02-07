'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Loader2, Save, User, Mail, ShieldCheck,
    BadgeCheck, Camera, Sparkles, Building2,
    Fingerprint, Info
} from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { ApiService } from '../../../services/api';
import { setCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';

const profileSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        accountType: string;
        emailVerified: boolean;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user.firstName,
            lastName: user.lastName,
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        setIsLoading(true);
        const toastId = toast.loading("Updating ledger identity...");

        try {
            const updatedUser = await ApiService.auth.updateProfile(data);

            // Sync local session storage for header/sidebar immediate UI updates
            const fullUser = { ...user, ...data };
            setCookie('givar_user', JSON.stringify(fullUser), { maxAge: 604800, path: '/' });

            toast.success("Identity updated successfully", { id: toastId });

            // Reset form state to current values to clear isDirty
            reset(data);
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to update profile";
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* --- LEFT COLUMN: IDENTITY CARD --- */}
            <div className="lg:col-span-4 space-y-6">
                <Card className="rounded-[32px] border-border/50 bg-card overflow-hidden shadow-xl relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/20 to-transparent opacity-40" />

                    <div className="p-8 text-center space-y-5">
                        <div className="relative inline-block">
                            <div className="h-28 w-28 rounded-[40px] bg-primary/10 flex items-center justify-center text-primary text-4xl font-black shadow-inner mx-auto border-2 border-primary/5 transition-transform group-hover:scale-105 duration-500">
                                {initials}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-9 w-9 rounded-2xl border-4 border-card bg-primary text-white flex items-center justify-center shadow-xl cursor-help" title="Identity Verified">
                                <BadgeCheck className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-2xl font-black tracking-tight text-foreground leading-tight">
                                {user.firstName} {user.lastName}
                            </h2>
                            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">{user.email}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2">
                            <Badge variant="outline" className="rounded-lg bg-secondary/50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border-border/50">
                                {user.role} Account
                            </Badge>
                            {user.emailVerified && (
                                <Badge className="rounded-lg bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest gap-1">
                                    <ShieldCheck className="h-3 w-3" /> Verified
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="bg-muted/30 p-6 border-t border-border/40">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            <span>Ecosystem Node</span>
                            <Fingerprint className="h-3 w-3 text-primary" />
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-2 font-medium">
                            Your public profile is cryptographically linked to your transaction history.
                            Name updates are recorded in the system audit log.
                        </p>
                    </div>
                </Card>

                {user.accountType === 'ORGANIZER' && (
                    <Card className="rounded-[24px] border-primary/20 bg-primary/[0.02] p-5 flex items-center gap-4 animate-in zoom-in duration-500">
                        <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none mb-1">Partner Node</p>
                            <p className="text-sm font-bold text-foreground truncate">Organizer Mode Active</p>
                        </div>
                    </Card>
                )}
            </div>

            {/* --- RIGHT COLUMN: EDIT FORM --- */}
            <div className="lg:col-span-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden">
                        <CardContent className="p-8 md:p-10 space-y-8">
                            <div className="flex items-center gap-3 border-b border-border/40 pb-6">
                                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">Personal Information</h3>
                                    <p className="text-xs text-muted-foreground font-medium">Update your profile display data for the Givar network.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="First Name"
                                    placeholder="Enter your first name"
                                    {...register('firstName')}
                                    error={errors.firstName?.message}
                                    disabled={isLoading}
                                    className="h-12"
                                />
                                <Input
                                    label="Last Name"
                                    placeholder="Enter your last name"
                                    {...register('lastName')}
                                    error={errors.lastName?.message}
                                    disabled={isLoading}
                                    className="h-12"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-foreground/70 ml-1">Account Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                    <Input
                                        value={user.email}
                                        readOnly
                                        className="pl-11 bg-muted/20 border-border/40 cursor-not-allowed opacity-60 h-12 select-none"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                        <BadgeCheck className="h-3.5 w-3.5" /> Immutable
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 px-1">
                                    <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-muted-foreground leading-relaxed italic font-medium">
                                        Email addresses are permanent ledger identifiers. To change your email, please initiate a formal account migration through Givar Support.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end items-center gap-4 pt-4">
                        {isDirty && (
                            <button
                                type="button"
                                onClick={() => reset()}
                                className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
                            >
                                Discard Changes
                            </button>
                        )}
                        <Button
                            type="submit"
                            disabled={isLoading || !isDirty}
                            className="h-14 rounded-2xl px-10 font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all gap-2"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Commit Changes
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}