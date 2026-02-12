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
import { Loader2, ArrowRight, Rocket, ShieldCheck, Sparkles, MailCheck, ChevronRight } from 'lucide-react';
import { cn } from '../../../../../../lib/utils/cn';

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

        if (isOrganizer) {
            ApiService.projects.getCategories()
                .then(setCategories)
                .catch(() => toast.error('Categories offline'));
        }
    }, [isOrganizer]);

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

    if (!isOrganizer) {
        return (
            <div className="max-w-xl mx-auto space-y-6 md:space-y-8 min-w-0">
                <div className="md:hidden px-1">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Launch cause</h1>
                </div>

                <div className="text-center space-y-2 py-4 min-w-0">
                    <div className="h-14 w-14 rounded-[24px] bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner">
                        <Rocket className="h-7 w-7" />
                    </div>
                    <h2 className="hidden md:block text-2xl font-bold tracking-tight text-foreground">Launch your cause</h2>
                    <p className="text-sm text-muted-foreground max-w-[280px] mx-auto font-medium leading-relaxed">
                        Activate organizer mode to propose projects and raise verified impact capital.
                    </p>
                </div>

                <div className="grid gap-3 min-w-0">
                    {[
                        { icon: ShieldCheck, title: 'Verified trust', desc: 'Complete identity vetting for donor confidence.', color: 'text-primary' },
                        { icon: Sparkles, title: 'Direct funding', desc: 'Automated procurement and ledger tracking.', color: 'text-blue-500' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-3xl border border-border/40 bg-card shadow-sm min-w-0 group hover:border-primary/20 transition-all">
                            <div className={cn("h-11 w-11 rounded-2xl bg-muted flex items-center justify-center shrink-0 shadow-inner", item.color)}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-sm text-foreground leading-none mb-1">{item.title}</h4>
                                <p className="text-xs text-muted-foreground truncate font-medium">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <Button
                    onClick={onUpgrade}
                    disabled={isUpgrading || isUnverified}
                    className="w-full h-14 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all gap-2"
                >
                    {isUpgrading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Activate organizer mode'}
                </Button>

                {isUnverified && (
                    <div className="p-5 rounded-3xl bg-amber-50 border border-amber-100 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-2">
                        <MailCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 font-bold leading-relaxed">
                            Cause initiation is restricted until you verify your email address. Please check your inbox.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6 min-w-0">

            <Card className="border-border/40 bg-card rounded-[32px] shadow-sm overflow-hidden min-w-0">
                <CardHeader className="p-6 md:p-8 border-b border-border/40 bg-muted/10">
                    <CardTitle className="text-lg md:text-xl font-bold">Start a new cause</CardTitle>
                    <CardDescription className="text-xs font-medium">
                        Begin with a compelling title and industry category.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8 pt-6 min-w-0">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 min-w-0">
                        <div className="space-y-5 min-w-0">
                            <Input
                                label="Project title"
                                placeholder="e.g. Provide clean water for families"
                                {...register('title')}
                                error={errors.title?.message}
                                disabled={isLoading || isUnverified}
                                className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                            />

                            <div className="space-y-1.5 min-w-0">
                                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Cause classification</label>
                                <Controller
                                    control={control}
                                    name="categoryId"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || isUnverified}>
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
                            className="w-full h-14 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all gap-2"
                            disabled={isLoading || categories.length === 0 || isUnverified}
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