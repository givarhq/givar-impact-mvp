'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../components/ui/card';
import { Button } from '../../../../../../components/ui/button';
import { Input } from '../../../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../../components/ui/select';
import { Badge } from '../../../../../../components/ui/badge';
import { ApiService } from '../../../../../../services/api';
import { getCookie, setCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import {
    Loader2, ArrowRight, ShieldCheck, AlertCircle, ListChecks,
    Image as ImageIcon, FileText, User, Users, Clock, Database,
    Hourglass, CheckCircle2, ChevronRight, Building2, Tag
} from 'lucide-react';
import { cn } from '../../../../../../lib/utils/cn';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const startSchema = z.object({
    title: z.string().min(10, 'Title must be at least 10 characters'),
    categoryId: z.string().uuid('Please select a sector'),
    subcategoryId: z.string().uuid('Please select a specific focus'),
    beneficiaryRelationship: z.string().optional().nullable(),
    beneficiaryName: z.string().optional().nullable(),
    beneficiaryAge: z.coerce.number().optional().nullable(),
    beneficiaryContact: z.string().optional().nullable(),
    organizationName: z.string().optional().nullable(),
    contactPhone: z.string().optional().nullable(),
});

type StartFormValues = z.infer<typeof startSchema>;

interface Subcategory {
    id: string;
    name: string;
    slug: string;
}

interface Category {
    id: string;
    name: string;
    subcategories?: Subcategory[];
}

export default function StartProposalPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const [isEmailUnverified, setIsEmailUnverified] = useState(false);
    const [orgStatus, setOrgStatus] = useState<string>('NOT_SUBMITTED');
    const [orgKycType, setOrgKycType] = useState<string | null>(null);
    const [userAccountType, setUserAccountType] = useState<string>('INDIVIDUAL');
    const [targetType, setTargetType] = useState<'SELF' | 'OTHER' | 'INDIVIDUAL' | 'GROUP' | null>(null);
    const [isGateCheckComplete, setIsGateCheckComplete] = useState(false);

    useEffect(() => {
        const userCookie = getCookie('givar_user');
        let parsedUser: any = null;

        if (userCookie) {
            try {
                parsedUser = JSON.parse(userCookie as string);
                setIsEmailUnverified(parsedUser.emailVerified === false);
                setOrgStatus(parsedUser.organization?.status || 'NOT_SUBMITTED');
                setOrgKycType(parsedUser.organization?.kycType || null);
                setUserAccountType(parsedUser.accountType || 'INDIVIDUAL');
            } catch (e) {
                setIsEmailUnverified(false);
            }
        }

        ApiService.projects.getCategories()
            .then(setCategories)
            .catch(() => toast.error('Categories offline'));

        ApiService.organizations.getMe()
            .then((profile) => {
                if (profile) {
                    setOrgStatus(profile.status);
                    setOrgKycType(profile.kycType);

                    if (parsedUser) {
                        let hasDrift = false;
                        if (parsedUser.organization?.status !== profile.status) hasDrift = true;
                        if (parsedUser.organization?.kycType !== profile.kycType) hasDrift = true;

                        if (hasDrift) {
                            parsedUser.organization = {
                                ...parsedUser.organization,
                                status: profile.status,
                                kycType: profile.kycType
                            };
                            setCookie('givar_user', JSON.stringify(parsedUser), { maxAge: 604800, path: '/' });
                        }
                    }
                }
            })
            .catch(() => {
                setOrgStatus('NOT_SUBMITTED');
            })
            .finally(() => {
                setIsGateCheckComplete(true);
            });

    }, []);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<StartFormValues>({
        resolver: zodResolver(startSchema),
        mode: 'onChange',
    });

    const selectedCategoryId = watch('categoryId');
    const selectedCategoryObj = categories.find(c => c.id === selectedCategoryId);
    const selectedCategoryName = selectedCategoryObj?.name?.toLowerCase() || '';
    const availableSubcategories = selectedCategoryObj?.subcategories || [];

    const handleTargetTypeChange = (type: 'SELF' | 'OTHER' | 'INDIVIDUAL' | 'GROUP') => {
        setTargetType(type);
        if (type === 'SELF') {
            setValue('beneficiaryRelationship', 'Self', { shouldValidate: true });
            setValue('beneficiaryName', null as any, { shouldValidate: true });
            setValue('beneficiaryAge', null as any, { shouldValidate: true });
            setValue('beneficiaryContact', null as any, { shouldValidate: true });
            setValue('organizationName', null as any, { shouldValidate: true });
            setValue('contactPhone', null as any, { shouldValidate: true });
        } else if (type === 'GROUP') {
            setValue('beneficiaryRelationship', null as any, { shouldValidate: true });
            setValue('beneficiaryName', null as any, { shouldValidate: true });
            setValue('beneficiaryAge', null as any, { shouldValidate: true });
            setValue('beneficiaryContact', null as any, { shouldValidate: true });
        } else {
            // OTHER or INDIVIDUAL
            setValue('organizationName', null as any, { shouldValidate: true });
            setValue('contactPhone', null as any, { shouldValidate: true });
            setValue('beneficiaryRelationship', null as any, { shouldValidate: true });
        }
    };

    let dynamicDocRequirements = "Vendor invoices and supporting proof.";
    if (selectedCategoryName.includes('medical')) {
        dynamicDocRequirements = "Medical report and hospital estimate.";
    } else if (selectedCategoryName.includes('education')) {
        dynamicDocRequirements = "Admission letter or school board approval, and fee invoice.";
    } else if (selectedCategoryName.includes('community')) {
        dynamicDocRequirements = "Project description and vendor quotations.";
    }

    const onSubmit = async (data: StartFormValues) => {
        if (isEmailUnverified || orgStatus !== 'VERIFIED') return;

        if (targetType === null) {
            toast.error('Please indicate who this cause is for.');
            return;
        }

        setIsLoading(true);
        try {
            const newProposal = await ApiService.proposals.create({
                ...data,
                categoryId: data.categoryId === '' ? null : data.categoryId,
                subcategoryId: data.subcategoryId === '' ? null : data.subcategoryId,
            } as any);
            router.push(`/dashboard/proposals/edit/${newProposal.id}/hook`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to initialize');
            setIsLoading(false);
        }
    };

    if (!isGateCheckComplete) {
        return (
            <div className="max-w-5xl mx-auto min-w-0 animate-in fade-in duration-500 pt-2 pb-20">
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-border/40 bg-card rounded-3xl shadow-sm space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                    <p className="text-sm font-bold text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    const isUpgradeRequired = userAccountType === 'ORGANIZER' && orgStatus === 'VERIFIED' && orgKycType === 'INDIVIDUAL';
    const isReadyToStart = !isEmailUnverified && orgStatus === 'VERIFIED' && !isUpgradeRequired;

    if (!isReadyToStart) {
        return (
            <div className="max-w-2xl mx-auto min-w-0 animate-in fade-in duration-500 pt-2 pb-20">
                <Card className="border-border/40 bg-card rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-8 text-center space-y-3 bg-muted/10 border-b border-border/40">
                        <div className="h-16 w-16 rounded-[24px] bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 border border-primary/20 shadow-inner">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Finish setup</h2>
                        <p className="text-sm text-muted-foreground max-w-[380px] mx-auto font-medium leading-relaxed">
                            Please complete verification before submitting your cause.
                        </p>
                    </div>

                    <CardContent className="p-6 md:p-8 space-y-4 flex flex-col">
                        {/* Step 1: Email Verification */}
                        {isEmailUnverified ? (
                            <Link
                                href="/dashboard/settings?tab=profile"
                                className="flex items-center justify-between gap-4 p-4 rounded-2xl border bg-muted/10 transition-all group active:scale-[0.99] cursor-pointer border-border/40 hover:bg-muted/20 hover:border-primary/30"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner transition-colors bg-amber-500/10 text-amber-600 border-amber-500/20">
                                        <Hourglass className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold transition-colors text-foreground group-hover:text-primary">
                                            Email verification
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">Confirm your email address</p>
                                    </div>
                                </div>
                                <span className="flex items-center gap-0.5 text-xs font-bold text-primary group-hover:text-primary/80 transition-colors shrink-0">
                                    Verify <ChevronRight className="h-3.5 w-3.5" />
                                </span>
                            </Link>
                        ) : (
                            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border/40 bg-muted/10">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner transition-colors bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">
                                            Email verification
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">Confirm your email address</p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none font-bold text-[11px] px-3 py-1 rounded-full">Verified</Badge>
                            </div>
                        )}

                        {/* Step 2: Identity Verification */}
                        {orgStatus === 'VERIFIED' && !isUpgradeRequired ? (
                            <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border/40 bg-muted/10">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner transition-colors bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">
                                            Identity verification
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">Provide official identification</p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none font-bold text-[11px] px-3 py-1 rounded-full">Verified</Badge>
                            </div>
                        ) : (
                            <Link
                                href="/dashboard/settings?tab=verification"
                                className={cn(
                                    "flex items-center justify-between gap-4 p-4 rounded-2xl border bg-muted/10 transition-all group active:scale-[0.99] cursor-pointer",
                                    orgStatus === 'REJECTED' ? "border-border/40 hover:bg-destructive/5 hover:border-destructive/30" :
                                        "border-border/40 hover:bg-muted/20 hover:border-primary/30"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner transition-colors",
                                        isUpgradeRequired ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                            orgStatus === 'PENDING' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                orgStatus === 'REJECTED' ? "bg-destructive/10 text-destructive border-destructive/20" :
                                                    "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                    )}>
                                        {isUpgradeRequired ? <Building2 className="h-5 w-5" /> :
                                            orgStatus === 'PENDING' ? <Clock className="h-5 w-5 animate-pulse" /> :
                                                orgStatus === 'REJECTED' ? <AlertCircle className="h-5 w-5" /> :
                                                    <Hourglass className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className={cn("text-sm font-bold transition-colors",
                                            isUpgradeRequired ? "text-foreground group-hover:text-blue-600" :
                                                orgStatus === 'PENDING' ? "text-foreground" :
                                                    orgStatus === 'REJECTED' ? "text-foreground group-hover:text-destructive" :
                                                        "text-foreground group-hover:text-primary"
                                        )}>
                                            {isUpgradeRequired ? 'Corporate upgrade' : 'Identity verification'}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {isUpgradeRequired ? 'Supply business registration' : 'Provide official identification'}
                                        </p>
                                    </div>
                                </div>
                                {orgStatus === 'PENDING' && !isUpgradeRequired ? (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 shadow-none font-bold text-[11px] px-3 py-1 rounded-full">Pending</Badge>
                                ) : (
                                    <span className={cn(
                                        "flex items-center gap-0.5 text-xs font-bold transition-colors shrink-0",
                                        isUpgradeRequired ? "text-blue-600 group-hover:text-blue-600/80" :
                                            orgStatus === 'REJECTED' ? "text-destructive group-hover:text-destructive/80" : "text-primary group-hover:text-primary/80"
                                    )}>
                                        {isUpgradeRequired ? 'Upgrade' : orgStatus === 'REJECTED' ? 'Fix' : 'Submit'} <ChevronRight className="h-3.5 w-3.5" />
                                    </span>
                                )}
                            </Link>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto min-w-0 animate-in fade-in duration-500 pt-2 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

                {/* Left Column: Form */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="border-border/40 bg-card rounded-3xl shadow-sm overflow-hidden min-w-0">
                        <CardHeader className="p-6 md:p-8 border-b border-border/40 bg-muted/10">
                            <CardTitle className="text-lg md:text-xl font-bold">Start a new cause</CardTitle>
                            <CardDescription className="text-xs font-medium">
                                Begin with a compelling title and industry classification.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 pt-6 min-w-0">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 min-w-0">
                                <div className="space-y-5 min-w-0">
                                    <Input
                                        label="Cause title"
                                        placeholder="e.g. Clean water for Owerri communities"
                                        {...register('title')}
                                        error={errors.title?.message}
                                        disabled={isLoading}
                                        className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                                    />

                                    {/* SECTOR CLASSIFICATION */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0">
                                        <div className="space-y-1.5 min-w-0">
                                            <label className="text-[11px] font-bold text-muted-foreground ml-1 flex items-center h-4">Primary sector</label>
                                            <Controller
                                                control={control}
                                                name="categoryId"
                                                render={({ field }) => (
                                                    <Select
                                                        onValueChange={(val) => {
                                                            field.onChange(val);
                                                            setValue('subcategoryId', '', { shouldValidate: true });
                                                        }}
                                                        value={field.value || undefined}
                                                        disabled={isLoading}
                                                    >
                                                        <SelectTrigger className="h-12 rounded-2xl border-border/40 bg-muted/20 focus:bg-background font-medium text-sm">
                                                            <SelectValue placeholder="Select a sector..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-[22px] shadow-xl border-border/40">
                                                            {categories.length === 0 ? (
                                                                <div className="p-4 text-xs text-muted-foreground text-center italic">Loading...</div>
                                                            ) : (
                                                                categories.map(cat => (
                                                                    <SelectItem key={cat.id} value={cat.id} className="rounded-xl text-xs py-2.5 font-bold">{cat.name}</SelectItem>
                                                                ))
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.categoryId && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.categoryId.message}</p>}
                                        </div>

                                        <div className="space-y-1.5 min-w-0">
                                            <label className="text-[11px] font-bold text-muted-foreground ml-1 flex items-center gap-1.5 h-4">
                                                <Tag className="h-3 w-3" /> Specific focus
                                            </label>
                                            <Controller
                                                control={control}
                                                name="subcategoryId"
                                                render={({ field }) => (
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value || undefined}
                                                        disabled={isLoading || !selectedCategoryId}
                                                    >
                                                        <SelectTrigger className="h-12 rounded-2xl border-border/40 bg-muted/20 focus:bg-background font-medium text-sm disabled:opacity-50">
                                                            <SelectValue placeholder="Select focus..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-[22px] shadow-xl border-border/40">
                                                            {availableSubcategories.length === 0 ? (
                                                                <div className="p-4 text-xs text-muted-foreground text-center italic">Select a sector first</div>
                                                            ) : (
                                                                availableSubcategories.map(sub => (
                                                                    <SelectItem key={sub.id} value={sub.id} className="rounded-xl text-xs py-2.5 font-bold">{sub.name}</SelectItem>
                                                                ))
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.subcategoryId && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.subcategoryId.message}</p>}
                                        </div>
                                    </div>

                                    {/* WHO IS THIS CAUSE FOR */}
                                    <div className="space-y-3 p-5 md:p-6 rounded-3xl bg-muted/10 border border-border/40 shadow-sm mt-6">
                                        <label className="text-[11px] font-bold text-muted-foreground flex items-center h-4">Who is this cause for?</label>
                                        <div className="flex flex-wrap gap-3">
                                            {userAccountType === 'ORGANIZER' ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTargetTypeChange('INDIVIDUAL')}
                                                        className={cn(
                                                            "flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 active:scale-[0.98] whitespace-nowrap",
                                                            targetType === 'INDIVIDUAL' ? "bg-primary/5 text-primary border-primary shadow-sm" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                                                        )}
                                                    >
                                                        <User className="h-4 w-4" /> An individual
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTargetTypeChange('GROUP')}
                                                        className={cn(
                                                            "flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 active:scale-[0.98] whitespace-nowrap",
                                                            targetType === 'GROUP' ? "bg-primary/5 text-primary border-primary shadow-sm" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                                                        )}
                                                    >
                                                        <Users className="h-4 w-4" /> A group or community
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTargetTypeChange('SELF')}
                                                        className={cn(
                                                            "flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 active:scale-[0.98] whitespace-nowrap",
                                                            targetType === 'SELF' ? "bg-primary/5 text-primary border-primary shadow-sm" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                                                        )}
                                                    >
                                                        <User className="h-4 w-4" /> Myself
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTargetTypeChange('OTHER')}
                                                        className={cn(
                                                            "flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 active:scale-[0.98] whitespace-nowrap",
                                                            targetType === 'OTHER' ? "bg-primary/5 text-primary border-primary shadow-sm" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                                                        )}
                                                    >
                                                        <User className="h-4 w-4" /> Someone else
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTargetTypeChange('GROUP')}
                                                        className={cn(
                                                            "flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 active:scale-[0.98] whitespace-nowrap",
                                                            targetType === 'GROUP' ? "bg-primary/5 text-primary border-primary shadow-sm" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                                                        )}
                                                    >
                                                        <Users className="h-4 w-4" /> A group or community
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <AnimatePresence>
                                            {(targetType === 'OTHER' || targetType === 'INDIVIDUAL') && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-hidden"
                                                >
                                                    <Input
                                                        label="Beneficiary full name"
                                                        placeholder="Legal name of beneficiary"
                                                        {...register('beneficiaryName')}
                                                        className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                                    />
                                                    <Input
                                                        label="Age"
                                                        type="number"
                                                        placeholder="Current age"
                                                        {...register('beneficiaryAge')}
                                                        className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                                    />
                                                    <Input
                                                        label="Relationship to submitter"
                                                        placeholder="e.g. Parent, Sibling, Community member"
                                                        {...register('beneficiaryRelationship')}
                                                        className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                                    />
                                                    <Input
                                                        label="Phone number (optional)"
                                                        placeholder="Direct contact number"
                                                        {...register('beneficiaryContact')}
                                                        className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                                    />
                                                </motion.div>
                                            )}
                                            {targetType === 'GROUP' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-hidden"
                                                >
                                                    <Input
                                                        label="Name of group, community, or institution"
                                                        placeholder="e.g. Owerri Youth Coalition"
                                                        {...register('organizationName')}
                                                        className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                                    />
                                                    <Input
                                                        label="Representative contact number"
                                                        placeholder="Direct contact number"
                                                        {...register('contactPhone')}
                                                        className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center">
                                    <Button
                                        type="submit"
                                        className="w-auto h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all gap-2 border-0 bg-primary hover:bg-primary/90 text-white"
                                        disabled={isLoading || categories.length === 0}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                Continue to setup <ArrowRight className="ml-1 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Preparation Checklist */}
                <div className="lg:col-span-5 space-y-4 pt-2 lg:pt-0">
                    <div className="flex items-center gap-2 px-2 text-foreground">
                        <ListChecks className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-bold">What you will need</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                        <div className="bg-card border border-border/40 p-5 rounded-3xl flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary border border-primary/10">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 pt-0.5">
                                <p className="text-sm font-bold text-foreground">Clear narrative</p>
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">A compelling story explaining who needs help and why.</p>
                            </div>
                        </div>

                        <div className="bg-card border border-border/40 p-5 rounded-3xl flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-600 border border-blue-500/10">
                                <ImageIcon className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 pt-0.5">
                                <p className="text-sm font-bold text-foreground">Visual assets</p>
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">High quality photos to act as proof of the current situation.</p>
                            </div>
                        </div>

                        <div className="bg-card border border-border/40 p-5 rounded-3xl flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600 border border-emerald-500/10">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 pt-0.5">
                                <p className="text-sm font-bold text-foreground">Cause evidence</p>
                                <motion.p
                                    key={dynamicDocRequirements}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-xs text-muted-foreground font-medium leading-relaxed transition-all"
                                >
                                    {dynamicDocRequirements}
                                </motion.p>
                            </div>
                        </div>

                        <div className="bg-card border border-border/40 p-5 rounded-3xl flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-600 border border-purple-500/10">
                                <Database className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 pt-0.5">
                                <p className="text-sm font-bold text-foreground">Budget estimates</p>
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">Clear breakdown of costs and the vendors you intend to use.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}