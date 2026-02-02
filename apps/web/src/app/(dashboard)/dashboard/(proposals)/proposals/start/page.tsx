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
import { Loader2, ArrowRight, Rocket, ShieldCheck, Sparkles } from 'lucide-react';

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

    const userCookie = getCookie('givar_user');
    const user = userCookie ? JSON.parse(userCookie as string) : null;
    const isOrganizer = user?.accountType === 'ORGANIZER';

    useEffect(() => {
        if (isOrganizer) {
            ApiService.projects.getCategories()
                .then(setCategories)
                .catch(() => toast.error('Could not load categories.'));
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
        setIsUpgrading(true);
        try {
            await ApiService.auth.upgradeToOrganizer();
            const updatedUser = { ...user, accountType: 'ORGANIZER' };
            setCookie('givar_user', JSON.stringify(updatedUser), { maxAge: 604800 });
            toast.success('Organizer mode activated!');
            router.refresh();
        } catch (e) {
            toast.error('Upgrade failed.');
        } finally {
            setIsUpgrading(false);
        }
    };

    const onSubmit = async (data: StartFormValues) => {
        setIsLoading(true);
        try {
            const newProposal = await ApiService.proposals.create(data);
            toast.success('Draft created! Lets add the details.');
            router.push(`/dashboard/proposals/edit/${newProposal.id}/hook`);
        } catch (error) {
            toast.error('Failed to create draft.');
            setIsLoading(false);
        }
    };

    if (!isOrganizer) {
        return (
            <div className="max-w-2xl mx-auto py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                    <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Rocket className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Launch your cause</h1>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Switch your account to Organizer mode to start proposing projects and raising funds.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <h4 className="font-bold text-sm text-foreground">Verified Trust</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Complete a one-time KYC process to ensure transparency and donor confidence.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h4 className="font-bold text-sm text-foreground">Direct Funding</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Access the Givar treasury for automated vendor payments and tracking.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={onUpgrade}
                    disabled={isUpgrading}
                    size="lg"
                    className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                >
                    {isUpgrading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Activate Organizer Mode'}
                </Button>
            </div>
        );
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader>
                <CardTitle className="text-2xl font-bold tracking-tight">Start a New Cause</CardTitle>
                <CardDescription>
                    Let&apos;s begin with a compelling title and the right category. This helps donors find your cause.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <Input
                        label="Project Title"
                        placeholder="e.g., Provide Clean Drinking Water for 100 Families in Rural Lagos"
                        {...register('title')}
                        error={errors.title?.message}
                        disabled={isLoading}
                    />

                    <Controller
                        control={control}
                        name="categoryId"
                        render={({ field }) => (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue placeholder="Select a primary category..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.length === 0 ? (
                                            <div className="p-2 text-sm text-muted-foreground">Loading categories...</div>
                                        ) : (
                                            categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.categoryId && <p className="text-xs text-destructive mt-1">{errors.categoryId.message}</p>}
                            </div>
                        )}
                    />

                    <div className="flex justify-end pt-4">
                        <Button type="submit" size="lg" className="h-12 rounded-xl" disabled={isLoading || categories.length === 0}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Save & Continue <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}