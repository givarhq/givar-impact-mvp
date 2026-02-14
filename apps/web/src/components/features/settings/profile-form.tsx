'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Loader2, ShieldCheck, Camera, AlertCircle,
    MailCheck, RefreshCcw, ChevronRight, Check, X
} from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { ApiService } from '../../../services/api';
import { setCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';
import { DangerZone } from './danger-zone';
import { ConfirmModal } from '../../ui/confirm-modal';

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
        avatarUrl?: string;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [editingField, setEditingField] = useState<'name' | null>(null);
    const [switchModal, setSwitchModal] = useState<{ isOpen: boolean, type: 'INDIVIDUAL' | 'ORGANIZER' | null }>({ isOpen: false, type: null });
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const onAvatarClick = () => fileInputRef.current?.click();

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return toast.error("Maximum image size is 2MB");

        setIsUploading(true);
        const toastId = toast.loading("Updating profile picture...");

        try {
            const { uploadUrl, key } = await ApiService.proposals.getUploadUrl({ fileType: file.type, useCase: 'public' });
            await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
            await ApiService.auth.updateAvatar(key);
            toast.success("Profile picture updated", { id: toastId });
            window.location.reload();
        } catch (error) {
            toast.error("Upload failed", { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (data: ProfileFormValues) => {
        setIsLoading(true);
        try {
            await ApiService.auth.updateProfile(data);
            const fullUser = { ...user, ...data };
            setCookie('givar_user', JSON.stringify(fullUser), { maxAge: 604800, path: '/' });
            toast.success("Profile updated");
            setEditingField(null);
            reset(data);
        } catch (error) {
            toast.error("Update failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestCode = async () => {
        setIsVerifying(true);
        try {
            await ApiService.auth.resendVerification(user.email);
            setShowCodeInput(true);
            toast.success("Verification code sent to your inbox");
        } catch (e) {
            toast.error("Failed to send code");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleVerifyCode = async () => {
        if (verificationCode.length !== 6) return;
        setIsVerifying(true);
        try {
            await ApiService.auth.verifyEmailCode(verificationCode);
            // Refresh full profile and sync cookie using updated getMe()
            await ApiService.auth.getMe();
            toast.success("Email verified successfully");
            window.location.reload(); // Refresh UI to clear unverified states globally
        } catch (e) {
            toast.error("Invalid verification code");
        } finally {
            setIsVerifying(false);
        }
    };

    const executeAccountSwitch = async () => {
        if (!switchModal.type) return;
        setIsLoading(true);
        try {
            await ApiService.auth.switchAccountType(switchModal.type);
            const fullUser = { ...user, accountType: switchModal.type };
            setCookie('givar_user', JSON.stringify(fullUser), { maxAge: 604800, path: '/' });
            toast.success(`Switched to ${switchModal.type.toLowerCase()} account`);
            setSwitchModal({ isOpen: false, type: null });
            window.location.reload();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Failed to switch account type");
        } finally {
            setIsLoading(false);
        }
    };

    const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 space-y-4">
                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <div className="p-6 text-center space-y-4">
                            <div className="relative inline-block group">
                                <div
                                    onClick={onAvatarClick}
                                    className={cn(
                                        "h-24 w-24 rounded-full flex items-center justify-center text-3xl font-black shadow-inner mx-auto border border-border/40 overflow-hidden transition-all",
                                        user.avatarUrl ? "bg-muted" : "bg-primary/5 text-primary"
                                    )}
                                >
                                    {user.avatarUrl ? <img src={user.avatarUrl} className="h-full w-full object-cover" alt="" /> : initials}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        {isUploading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="text-lg font-bold text-foreground">{user.firstName} {user.lastName}</h2>
                                <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-1.5">
                                <Badge variant="outline" className="rounded-3xl bg-muted/30 px-2 py-0.5 text-xs font-bold uppercase border-border/40">{user.role}</Badge>
                                {user.emailVerified ? (
                                    <Badge className="rounded-3xl bg-emerald-50 text-emerald-600 border-emerald-100 text-xs font-bold uppercase gap-1">
                                        <ShieldCheck className="h-3 w-3" /> Verified
                                    </Badge>
                                ) : (
                                    <Badge className="rounded-3xl bg-amber-50 text-amber-600 border-amber-100 text-xs font-bold uppercase gap-1 animate-pulse">
                                        <AlertCircle className="h-3 w-3" /> Unverified
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground">Account Type</span>
                                <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-3xl">{user.accountType}</span>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full h-9 rounded-3xl text-xs font-bold gap-2 border-border/60"
                                onClick={() => setSwitchModal({
                                    isOpen: true,
                                    type: user.accountType === 'INDIVIDUAL' ? 'ORGANIZER' : 'INDIVIDUAL'
                                })}
                            >
                                <RefreshCcw className="h-3.5 w-3.5" /> Switch to {user.accountType === 'INDIVIDUAL' ? 'Organizer' : 'Individual'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-8 space-y-4">
                    {!user.emailVerified && (
                        <div className="p-4 rounded-3xl bg-amber-50 border border-amber-100 space-y-3 shadow-sm animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                                <MailCheck className="h-5 w-5 text-amber-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-amber-900 text-xs uppercase">Verify Identity</h4>
                                    <p className="text-xs text-amber-700 font-medium">Verify your email to establish trust on the impact ledger.</p>
                                </div>
                                {!showCodeInput && (
                                    <Button onClick={handleRequestCode} disabled={isVerifying} className="h-8 rounded-3xl bg-amber-600 text-white font-bold text-xs px-4">
                                        {isVerifying ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Get Code'}
                                    </Button>
                                )}
                            </div>
                            {showCodeInput && (
                                <div className="flex flex-col sm:flex-row gap-2 animate-in zoom-in-95">
                                    <Input placeholder="Enter 6-digit code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="h-9 bg-white text-center font-bold tracking-widest text-sm rounded-3xl" />
                                    <Button onClick={handleVerifyCode} disabled={isVerifying || verificationCode.length !== 6} className="h-9 rounded-3xl px-6 font-bold text-xs">Verify</Button>
                                </div>
                            )}
                        </div>
                    )}

                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardContent className="p-0">
                            <div
                                onClick={() => setEditingField('name')}
                                className={cn(
                                    "flex items-center justify-between p-5 md:p-6 border-b border-border/40 transition-all cursor-pointer hover:bg-muted/30",
                                    editingField === 'name' ? "bg-muted/10" : ""
                                )}
                            >
                                <div className="space-y-1 flex-1 min-w-0">
                                    <p className="text-xs font-bold text-muted-foreground tracking-widest">Full Name</p>
                                    {editingField === 'name' ? (
                                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-2 pt-1 animate-in slide-in-from-left-1" onClick={(e) => e.stopPropagation()}>
                                            <Input {...register('firstName')} error={errors.firstName?.message} className="h-9 rounded-3xl text-sm" autoFocus />
                                            <Input {...register('lastName')} error={errors.lastName?.message} className="h-9 rounded-3xl text-sm" />
                                            <div className="flex gap-2">
                                                <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-3xl" disabled={isLoading}><Check className="h-4 w-4" /></Button>
                                                <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-3xl" onClick={() => { setEditingField(null); reset(); }}><X className="h-4 w-4" /></Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <p className="text-sm font-bold text-foreground">{user.firstName} {user.lastName}</p>
                                    )}
                                </div>
                                {!editingField && <ChevronRight className="h-4 w-4 shrink-0 ml-4 text-muted-foreground/30 group-hover:text-primary transition-all" />}
                            </div>

                            <div className="p-5 md:p-6 border-b border-border/40 bg-muted/10 opacity-70">
                                <p className="text-xs font-bold text-muted-foreground tracking-widest mb-1">Email Address</p>
                                <p className="text-sm font-bold text-foreground">{user.email}</p>
                            </div>

                            <div className="p-5 md:p-6 bg-muted/10 opacity-70">
                                <p className="text-xs font-bold text-muted-foreground tracking-widest mb-1">Account ID</p>
                                <p className="text-xs font-mono text-foreground truncate">{user.id}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <DangerZone />

            <ConfirmModal
                isOpen={switchModal.isOpen}
                onClose={() => setSwitchModal({ isOpen: false, type: null })}
                onConfirm={executeAccountSwitch}
                isLoading={isLoading}
                title={`Switch Account Mode`}
                description={`Switch your account to ${switchModal.type === 'ORGANIZER' ? 'Organizer' : 'Individual'}? Upgrading allows cause launches, while downgrading restricts them.`}
                confirmText="Confirm Switch"
            />
        </div>
    );
}