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
import { ApiService } from '../../../../../../services/api';
import { getCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import { Loader2, ArrowRight, ShieldCheck, MailCheck, AlertCircle, ListChecks, Image as ImageIcon, FileText, User, Users, Clock, ShieldAlert } from 'lucide-react';
import { cn } from '../../../../../../lib/utils/cn';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const startSchema = z.object({
    title: z.string().min(10, 'Title must be at least 10 characters'),
    categoryId: z.string().uuid('Please select a category'),
    beneficiaryRelationship: z.string().optional().nullable(),
    beneficiaryName: z.string().optional().nullable(),
    beneficiaryAge: z.coerce.number().optional().nullable(),
    beneficiaryContact: z.string().optional().nullable(),
});

type StartFormValues = z.infer<typeof startSchema>;

interface Category {
    id: string;
    name: string;
}

export default function StartProposalPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const [isEmailUnverified, setIsEmailUnverified] = useState(false);
    const [orgStatus, setOrgStatus] = useState<string>('NOT_SUBMITTED');
    const [targetType, setTargetType] = useState<'SELF' | 'OTHER' | null>(null);

    useEffect(() => {
        const userCookie = getCookie('givar_user');
        if (userCookie) {
            try {
                const user = JSON.parse(userCookie as string);
                setIsEmailUnverified(user.emailVerified === false);
                setOrgStatus(user.organization?.status || 'NOT_SUBMITTED');
            } catch (e) {
                setIsEmailUnverified(false);
            }
        }

        ApiService.projects.getCategories()
            .then(setCategories)
            .catch(() => toast.error('Categories offline'));

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
    });

    const selectedCategoryId = watch('categoryId');
    const selectedCategoryName = categories.find(c => c.id === selectedCategoryId)?.name?.toLowerCase() || '';

    const handleTargetTypeChange = (type: 'SELF' | 'OTHER') => {
        setTargetType(type);
        if (type === 'SELF') {
            setValue('beneficiaryRelationship', 'Self', { shouldValidate: true });
            setValue('beneficiaryName', null, { shouldValidate: true });
            setValue('beneficiaryAge', null, { shouldValidate: true });
            setValue('beneficiaryContact', null, { shouldValidate: true });
        } else {
            setValue('beneficiaryRelationship', '', { shouldValidate: true });
        }
    };

    // Dynamic Logic for Document Requirements
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
            const newProposal = await ApiService.proposals.create(data);
            router.push(`/dashboard/proposals/edit/${newProposal.id}/hook`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to initialize');
            setIsLoading(false);
        }
    };

    // --- GATEKEEPER UI RENDERING ---

    if (isEmailUnverified) {
        return (
            <div className="max-w-xl mx-auto space-y-4 min-w-0 animate-in fade-in duration-500 pt-2 pb-20">
                <div className="text-center space-y-2 py-2">
                    <div className="h-16 w-16 rounded-[24px] bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-500/20 shadow-inner">
                        <MailCheck className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Verify your email</h2>
                    <p className="text-sm text-muted-foreground max-w-[320px] mx-auto font-medium leading-relaxed">
                        To maintain a secure environment, you must verify your email address before proposing causes.
                    </p>
                </div>

                <Card className="border-rose-200 bg-rose-50/30 rounded-3xl overflow-hidden shadow-sm">
                    <CardContent className="p-6 space-y-6 flex flex-col items-center">
                        <div className="flex items-start gap-3 w-full">
                            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-rose-900">Action required</p>
                                <p className="text-xs text-rose-800 leading-relaxed font-medium">
                                    Check your inbox for a verification link or generate a new code in your profile settings.
                                </p>
                            </div>
                        </div>
                        <Link href="/dashboard/settings?tab=profile" className="block">
                            <Button className="w-[12rem] h-12 rounded-3xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white border-0 gap-2 shadow-lg shadow-rose-600/20">
                                Verify profile <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (orgStatus === 'PENDING') {
        return (
            <div className="max-w-xl mx-auto space-y-4 min-w-0 animate-in fade-in duration-500 pt-2 pb-20">
                <div className="text-center space-y-2 py-2">
                    <div className="h-16 w-16 rounded-[24px] bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-500/20 shadow-inner">
                        <Clock className="h-8 w-8 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Review in progress</h2>
                    <p className="text-sm text-muted-foreground max-w-[320px] mx-auto font-medium leading-relaxed">
                        Your identity documents are currently being reviewed. You can start a cause once approved.
                    </p>
                </div>

                <Card className="border-amber-200 bg-amber-50/30 rounded-3xl overflow-hidden shadow-sm">
                    <CardContent className="p-6 space-y-6 flex flex-col items-center">
                        <Link href="/dashboard/settings?tab=org" className="block">
                            <Button className="w-[12rem] h-12 rounded-3xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white border-0 gap-2 shadow-lg shadow-amber-600/20">
                                View status <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (orgStatus === 'NOT_SUBMITTED' || orgStatus === 'REJECTED') {
        return (
            <div className="max-w-xl mx-auto space-y-4 min-w-0 animate-in fade-in duration-500 pt-2 pb-20">
                <div className="text-center space-y-2 py-2">
                    <div className="h-16 w-16 rounded-[24px] bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Verify your identity</h2>
                    <p className="text-sm text-muted-foreground max-w-[320px] mx-auto font-medium leading-relaxed">
                        We require all cause organizers to verify their identity once before they can publish projects on the ledger.
                    </p>
                </div>

                <Card className="border-border/40 bg-card rounded-3xl overflow-hidden shadow-sm">
                    <CardContent className="p-6 space-y-6 flex flex-col items-center">
                        {orgStatus === 'REJECTED' && (
                            <div className="flex items-start gap-3 w-full p-4 rounded-2xl bg-destructive/5 border border-destructive/10 mb-2">
                                <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-destructive">Previous submission declined</p>
                                    <p className="text-xs text-foreground/80 leading-relaxed font-medium">
                                        Your previous verification documents were not accepted. Please review the feedback in your settings and try again.
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-start gap-3 w-full">
                            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-foreground">One-time setup</p>
                                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                    You only need to do this once. Once approved, you can launch as many causes as you want without re-verifying.
                                </p>
                            </div>
                        </div>
                        <Link href="/dashboard/settings?tab=org" className="block">
                            <Button className="w-[12rem] h-12 rounded-3xl font-bold text-xs bg-primary hover:bg-primary/90 text-white border-0 gap-2 shadow-lg shadow-primary/20">
                                Verify identity <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
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
                            <CardTitle className="text-lg md:text-xl font-bold">Start a New Cause</CardTitle>
                            <CardDescription className="text-xs font-medium">
                                Begin with a compelling title and industry category.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 pt-6 min-w-0">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 min-w-0">
                                <div className="space-y-5 min-w-0">
                                    <Input
                                        label="Project title"
                                        placeholder="e.g. Provide clean water for families"
                                        {...register('title')}
                                        error={errors.title?.message}
                                        disabled={isLoading}
                                        className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                                    />

                                    <div className="space-y-1.5 min-w-0">
                                        <label className="text-[11px] font-bold text-muted-foreground ml-1">Cause classification</label>
                                        <Controller
                                            control={control}
                                            name="categoryId"
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                                    <SelectTrigger className="h-12 rounded-2xl border-border/40 bg-muted/20 focus:bg-background font-medium text-sm">
                                                        <SelectValue placeholder="Select classification..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-[22px] shadow-xl border-border/40">
                                                        {categories.length === 0 ? (
                                                            <div className="p-4 text-xs text-muted-foreground text-center italic">Loading categories...</div>
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

                                    <div className="space-y-3 p-5 md:p-6 rounded-3xl bg-muted/10 border border-border/40 shadow-sm mt-6">
                                        <label className="text-[11px] font-bold text-muted-foreground">Who is this cause for?</label>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleTargetTypeChange('SELF')}
                                                className={cn(
                                                    "flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 active:scale-[0.98]",
                                                    targetType === 'SELF' ? "bg-primary/5 text-primary border-primary shadow-sm" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                                                )}
                                            >
                                                <User className="h-4 w-4" /> Myself
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleTargetTypeChange('OTHER')}
                                                className={cn(
                                                    "flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 active:scale-[0.98]",
                                                    targetType === 'OTHER' ? "bg-primary/5 text-primary border-primary shadow-sm" : "bg-card text-muted-foreground border-border/40 hover:bg-muted"
                                                )}
                                            >
                                                <Users className="h-4 w-4" /> Someone else
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {targetType === 'OTHER' && (
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
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center">
                                    <Button
                                        type="submit"
                                        className="w-auto h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all gap-2 border-0"
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
                                <p className="text-sm font-bold text-foreground">Clear Narrative</p>
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">A compelling story explaining who needs help and why.</p>
                            </div>
                        </div>

                        <div className="bg-card border border-border/40 p-5 rounded-3xl flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-600 border border-blue-500/10">
                                <ImageIcon className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 pt-0.5">
                                <p className="text-sm font-bold text-foreground">Visual Assets</p>
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">High quality photos to act as proof of the current situation.</p>
                            </div>
                        </div>

                        <div className="bg-card border border-border/40 p-5 rounded-3xl flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600 border border-emerald-500/10">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 pt-0.5">
                                <p className="text-sm font-bold text-foreground">Cause Evidence</p>
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
                                <User className="h-5 w-5" />
                            </div>
                            <div className="space-y-1 pt-0.5">
                                <p className="text-sm font-bold text-foreground">Vendor Details</p>
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">Names, contacts, and bank information of the people doing the work.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}