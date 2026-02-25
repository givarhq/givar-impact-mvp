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
import { getCookie, setCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import { Loader2, ArrowRight, Rocket, ShieldCheck, Sparkles, MailCheck, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '../../../../../../lib/utils/cn';
import Link from 'next/link';

const startSchema = z.object({
    title: z.string().min(10, 'Title must be at least 10 characters'),
    categoryId: z.string().uuid('Please select a category'),
});

type StartFormValues = z.infer<typeof startSchema>;

interface Category {
    id: string;
    name: string;
}

export default function StartProposalPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isUnverified, setIsUnverified] = useState(false);

    const userCookie = getCookie('givar_user');
    const user = userCookie ? JSON.parse(userCookie as string) : null;
    const isOrganizer = user?.accountType === 'ORGANIZER';

    useEffect(() => {
        if (user) {
            setIsUnverified(user.emailVerified === false);
        }

        // Logic: Allow category fetching for all users since we now support Hybrid Impact
        ApiService.projects.getCategories()
            .then(setCategories)
            .catch(() => toast.error('Categories offline'));

    }, []);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<StartFormValues>({
        resolver: zodResolver(startSchema),
    });

    const onUpgrade = async () => {
        if (isUnverified) return;
        setIsUpgrading(true);
        try {
            // Logic: This action is less critical now but kept for legacy "Organization" upgrades
            // if we want to force full org status later.
            await ApiService.auth.upgradeToOrganizer();
            const updatedUser = { ...user, accountType: 'ORGANIZER' };
            setCookie('givar_user', JSON.stringify(updatedUser), { maxAge: 604800, path: '/' });
            toast.success('Organizer mode active');
            router.refresh();
        } catch (e) {
            toast.error('Activation failed');
        } finally {
            setIsUpgrading(false);
        }
    };

    const onSubmit = async (data: StartFormValues) => {
        if (isUnverified) return;
        setIsLoading(true);
        try {
            const newProposal = await ApiService.proposals.create(data);
            router.push(`/dashboard/proposals/edit/${newProposal.id}/hook`);
        } catch (error) {
            toast.error('Failed to initialize');
            setIsLoading(false);
        }
    };

    // --- CASE 1: Identity Block (Email Verification) ---
    if (isUnverified) {
        return (
            <div className="max-w-xl mx-auto space-y-4 min-w-0 animate-in fade-in duration-500 pt-2">
                <div className="text-center space-y-2 py-2">
                    <div className="h-16 w-16 rounded-[24px] bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-500/20 shadow-inner">
                        <MailCheck className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Verify your identity</h2>
                    <p className="text-sm text-muted-foreground max-w-[320px] mx-auto font-medium leading-relaxed">
                        To maintain a secure environment, you must verify your email address before proposing causes.
                    </p>
                </div>

                <Card className="border-rose-200 bg-rose-50/30 rounded-3xl overflow-hidden shadow-sm">
                    <CardContent className="p-6 space-y-6 flex flex-col items-center">
                        <div className="flex items-start gap-3 w-full">
                            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-rose-900 ">Action Required</p>
                                <p className="text-xs text-rose-800 leading-relaxed font-medium">
                                    Check your inbox for a verification link or generate a new code in your profile settings.
                                </p>
                            </div>
                        </div>
                        <Link href="/dashboard/settings?tab=profile" className="block">
                            <Button className="w-[12rem] h-12 rounded-3xl font-bold text-xs  tracking-widest bg-rose-600 hover:bg-rose-700 text-white border-0 gap-2 shadow-lg shadow-rose-600/20">
                                Verify Profile <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Logic: The "Mode Block" is REMOVED. Both INDIVIDUAL and ORGANIZER can now proceed.
    // CASE 2 is merged into CASE 3.

    // --- CASE 3: Authorized (Any Verified User) ---
    return (
        <div className="max-w-xl mx-auto space-y-4 min-w-0 animate-in fade-in duration-500 pt-2">
            <Card className="border-border/40 bg-card rounded-3xl shadow-sm overflow-hidden min-w-0">
                <CardHeader className="p-6 md:p-8 border-b border-border/40 bg-muted/10">
                    <CardTitle className="text-lg md:text-xl font-bold">Start a new cause</CardTitle>
                    <CardDescription className="text-xs font-medium">
                        Begin with a compelling title & industry category.
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
                                <label className="text-[11px] font-bold text-muted-foreground  tracking-widest ml-1">Cause classification</label>
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
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all gap-2 border-0"
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
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}