'use client';

import React, { useState, useRef, memo } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Loader2, ShieldCheck, Camera, AlertCircle,
    MailCheck, RefreshCcw, ChevronRight, Check, X, Phone
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
    phoneNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber?: string;
        role: string;
        accountType: string;
        emailVerified: boolean;
        avatarUrl?: string;
        organization?: {
            status: string;
            legalName: string;
        } | null;
    };
}

export const ProfileForm = memo(function ProfileForm({ user }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [editingField, setEditingField] = useState<'personal' | null>(null);
    const [switchModal, setSwitchModal] = useState<{ isOpen: boolean, type: 'INDIVIDUAL' | 'ORGANIZER' | null }>({ isOpen: false, type: null });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber || '',
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
            const { uploadUrl, key, publicUrl, provider, uploadData } = await ApiService.proposals.getUploadUrl({ fileType: file.type, useCase: 'public' });

            let finalKey = key;
            let finalUrl = publicUrl;

            if (provider === 'cloudinary') {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('api_key', uploadData.apiKey);
                formData.append('timestamp', uploadData.timestamp.toString());
                formData.append('signature', uploadData.signature);
                formData.append('folder', uploadData.folder);

                const res = await fetch(uploadUrl, { method: 'POST', body: formData });
                if (!res.ok) throw new Error('Cloudinary upload failed');
                const data = await res.json();

                finalKey = data.secure_url;
                finalUrl = data.secure_url;
            } else {
                await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
            }

            await ApiService.auth.updateAvatar(finalUrl || finalKey);

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
            // Logic: Consistent 24h maxAge for identity sync
            setCookie('givar_user', JSON.stringify(fullUser), { maxAge: 86400, path: '/' });
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
            await ApiService.auth.getMe();
            toast.success("Email verified successfully");
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
            setCookie('givar_user', JSON.stringify(fullUser), { maxAge: 86400, path: '/' });
            toast.success(`Switched to ${switchModal.type === 'ORGANIZER' ? 'Organization' : 'Personal'} Account`);
            setSwitchModal({ isOpen: false, type: null });
            window.location.reload();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Failed to switch account type");
        } finally {
            setIsLoading(false);
        }
    };

    const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

    // Mapping for UI Display
    const accountTypeLabel = user.accountType === 'INDIVIDUAL' ? 'Personal Account' : 'Organization Account';
    const isCurrentlyVerified = user.organization?.status === 'VERIFIED';

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
                                        "h-24 w-24 rounded-full flex items-center justify-center text-3xl font-black shadow-inner mx-auto border border-border/40 overflow-hidden transition-all relative",
                                        user.avatarUrl ? "bg-muted" : "bg-primary/5 text-primary"
                                    )}
                                >
                                    {user.avatarUrl ? (
                                        <Image
                                            src={user.avatarUrl}
                                            fill
                                            sizes="96px"
                                            className="object-cover"
                                            alt=""
                                        />
                                    ) : (
                                        initials
                                    )}
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
                                <Badge variant="outline" className="rounded-3xl bg-muted/30 px-2 py-0.5 text-xs font-bold border-border/40">{user.role}</Badge>
                                {user.emailVerified ? (
                                    <Badge className="rounded-3xl bg-emerald-50 text-emerald-600 border-emerald-100 text-xs font-bold gap-1">
                                        <ShieldCheck className="h-3 w-3" /> Verified
                                    </Badge>
                                ) : (
                                    <Badge className="rounded-3xl bg-amber-50 text-amber-600 border-amber-100 text-xs font-bold gap-1 animate-pulse">
                                        <AlertCircle className="h-3 w-3" /> Unverified
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground">Account Mode</span>
                                <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-3xl">
                                    {accountTypeLabel}
                                </span>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full h-9 rounded-3xl text-xs font-bold gap-2 border-border/60"
                                onClick={() => setSwitchModal({
                                    isOpen: true,
                                    type: user.accountType === 'INDIVIDUAL' ? 'ORGANIZER' : 'INDIVIDUAL'
                                })}
                            >
                                <RefreshCcw className="h-3.5 w-3.5" /> Switch to {user.accountType === 'INDIVIDUAL' ? 'Organization Account' : 'Personal Account'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-8 space-y-4">
                    {!user.emailVerified && (
                        <div className="p-4 rounded-3xl bg-amber-50 border-amber-100 space-y-3 shadow-sm animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                                <MailCheck className="h-5 w-5 text-amber-600 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-amber-900 text-xs">Verify Identity</h4>
                                    <p className="text-xs text-amber-700 font-medium">Please verify your email to donate to and launch causes.</p>
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
                                onClick={() => setEditingField('personal')}
                                className={cn(
                                    "flex items-center justify-between p-5 md:p-6 border-b border-border/40 transition-all cursor-pointer hover:bg-muted/30",
                                    editingField === 'personal' ? "bg-muted/10 cursor-default hover:bg-muted/10" : ""
                                )}
                            >
                                <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-3">
                                        <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Personal Information</p>
                                    </div>
                                    {editingField === 'personal' ? (
                                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1 animate-in slide-in-from-left-1" onClick={(e) => e.stopPropagation()}>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Input label="First Name" {...register('firstName')} error={errors.firstName?.message} className="h-10 rounded-2xl text-sm" />
                                                <Input label="Last Name" {...register('lastName')} error={errors.lastName?.message} className="h-10 rounded-2xl text-sm" />
                                            </div>
                                            <Input label="Phone Number" placeholder="+234..." {...register('phoneNumber')} error={errors.phoneNumber?.message} className="h-10 rounded-2xl text-sm" />

                                            <div className="flex gap-2 pt-2 border-t border-border/40">
                                                <Button type="submit" className="h-10 rounded-3xl font-bold text-xs px-6 shadow-sm" disabled={isLoading}>
                                                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Save Details</>}
                                                </Button>
                                                <Button type="button" variant="outline" className="h-10 rounded-3xl font-bold text-xs px-6" onClick={(e) => { e.stopPropagation(); setEditingField(null); reset(); }}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground tracking-widest mb-0.5">Full Name</p>
                                                <p className="text-sm font-bold text-foreground">{user.firstName} {user.lastName}</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                {user.phoneNumber || <span className="text-xs font-medium italic text-muted-foreground">Not provided</span>}
                                            </div>
                                        </div>
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
                title={`Switch to ${switchModal.type === 'ORGANIZER' ? 'Organization' : 'Personal'} Mode?`}
                variant={isCurrentlyVerified ? 'warning' : 'default'}
                description={
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                            {switchModal.type === 'ORGANIZER'
                                ? 'Organization mode lets you manage verified entities and run causes on their behalf.'
                                : 'Personal mode is designed for individual use and personal impact.'}
                        </p>

                        {isCurrentlyVerified && (
                            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 mt-4">
                                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-800 leading-relaxed">
                                    <strong>Verification will be reset.</strong>
                                    <p className="mt-1">
                                        You'll need to submit new {user.accountType === 'INDIVIDUAL' ? 'individual' : 'corporate'} documents to continue creating causes.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                }
                confirmText="Switch"
            />
        </div>
    );
});