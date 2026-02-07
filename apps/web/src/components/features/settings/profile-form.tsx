'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Loader2, Save, User, Mail, ShieldCheck,
    BadgeCheck, Camera, Building2,
    Fingerprint, Info, UploadCloud, AlertCircle, RefreshCcw, MailCheck
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
        const toastId = toast.loading("Saving changes...");
        try {
            await ApiService.auth.updateProfile(data);
            const fullUser = { ...user, ...data };
            setCookie('givar_user', JSON.stringify(fullUser), { maxAge: 604800, path: '/' });
            toast.success("Profile information updated", { id: toastId });
            reset(data);
        } catch (error) {
            toast.error("Update failed", { id: toastId });
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
            toast.success("Email verified successfully");
            setCookie('givar_user', JSON.stringify({ ...user, emailVerified: true }), { maxAge: 604800, path: '/' });
            window.location.reload();
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
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-[32px] border-border/50 bg-card overflow-hidden shadow-xl relative group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/20 to-transparent opacity-40" />
                        <div className="p-8 text-center space-y-5">
                            <div className="relative inline-block">
                                <div
                                    onClick={onAvatarClick}
                                    className={cn(
                                        "h-28 w-28 rounded-[40px] flex items-center justify-center text-4xl font-black shadow-inner mx-auto border-2 border-primary/5 cursor-pointer relative overflow-hidden transition-all group-hover:scale-105 duration-500",
                                        isUploading ? "opacity-50" : "opacity-100",
                                        user.avatarUrl ? "bg-muted" : "bg-primary/10 text-primary"
                                    )}
                                >
                                    {user.avatarUrl ? <img src={user.avatarUrl} className="h-full w-full object-cover" alt="Avatar" /> : initials}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isUploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <UploadCloud className="h-6 w-6 text-white" />}
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-2xl font-black tracking-tight text-foreground">{user.firstName} {user.lastName}</h2>
                                <p className="text-xs text-muted-foreground font-medium">{user.email}</p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-2">
                                <Badge variant="outline" className="rounded-lg bg-secondary/50 px-2.5 py-1 text-[9px] font-black uppercase border-border/50">{user.role}</Badge>
                                {user.emailVerified ? (
                                    <Badge className="rounded-lg bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase gap-1">
                                        <ShieldCheck className="h-3 w-3" /> Verified
                                    </Badge>
                                ) : (
                                    <Badge className="rounded-lg bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] font-black uppercase gap-1 animate-pulse">
                                        <AlertCircle className="h-3 w-3" /> Unverified
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-[28px] border-border/50 bg-card overflow-hidden shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account Type</span>
                                <Badge className="text-[9px] font-bold uppercase">{user.accountType}</Badge>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full h-11 rounded-xl text-xs font-bold gap-2"
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

                <div className="lg:col-span-8 space-y-6">

                    {!user.emailVerified && (
                        <div className="p-6 rounded-[28px] bg-amber-500/5 border border-amber-500/20 space-y-4 animate-in slide-in-from-top-2 duration-500">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                                    <MailCheck className="h-5 w-5" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h4 className="font-bold text-amber-800 text-sm uppercase tracking-tight">Email Verification Required</h4>
                                    <p className="text-[11px] text-amber-700/80 leading-relaxed font-medium">
                                        Verify your email to unlock all platform features and secure your account.
                                    </p>
                                </div>
                                {!showCodeInput && (
                                    <Button onClick={handleRequestCode} disabled={isVerifying} className="h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white border-0 font-bold text-xs px-6">
                                        {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Code'}
                                    </Button>
                                )}
                            </div>

                            {showCodeInput && (
                                <div className="flex flex-col sm:flex-row gap-3 pt-2 animate-in fade-in zoom-in-95">
                                    <Input
                                        placeholder="Enter 6-digit code"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="h-12 bg-white text-center font-bold tracking-[0.3em]"
                                    />
                                    <Button onClick={handleVerifyCode} disabled={isVerifying || verificationCode.length !== 6} className="h-12 rounded-xl bg-primary text-white font-bold px-8">
                                        {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify Code'}
                                    </Button>
                                    <Button variant="ghost" onClick={() => setShowCodeInput(false)} className="h-12 text-muted-foreground text-xs">Cancel</Button>
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden">
                            <CardContent className="p-8 md:p-10 space-y-8">
                                <div className="flex items-center gap-3 border-b border-border/40 pb-6">
                                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground"><User className="h-5 w-5" /></div>
                                    <h3 className="font-bold text-lg text-foreground">Personal Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="First Name" {...register('firstName')} error={errors.firstName?.message} disabled={isLoading} className="h-12" />
                                    <Input label="Last Name" {...register('lastName')} error={errors.lastName?.message} disabled={isLoading} className="h-12" />
                                </div>
                            </CardContent>
                        </Card>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading || !isDirty} className="h-14 rounded-2xl px-10 font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20">
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            <DangerZone />

            <ConfirmModal
                isOpen={switchModal.isOpen}
                onClose={() => setSwitchModal({ isOpen: false, type: null })}
                onConfirm={executeAccountSwitch}
                isLoading={isLoading}
                title={`Switch to ${switchModal.type === 'ORGANIZER' ? 'Organizer' : 'Individual'} Account`}
                description={switchModal.type === 'ORGANIZER'
                    ? "Upgrading allows you to create projects and access fundraising tools. You may be required to complete verification."
                    : "Downgrading will restrict your ability to create new projects. Existing projects will remain active."
                }
                confirmText="Confirm Switch"
            />
        </div>
    );
}