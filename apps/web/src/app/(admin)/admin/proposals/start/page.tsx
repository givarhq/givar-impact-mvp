'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { ApiService } from '../../../../../services/api';
import toast from 'react-hot-toast';
import { Loader2, ArrowRight, User, HeartHandshake, Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const startSchema = z.object({
    title: z.string().min(10, 'Title must be at least 10 characters'),
    categoryId: z.string().uuid('Please select a sector'),
    subcategoryId: z.string().uuid('Please select a specific focus'),
    beneficiaryName: z.string().min(2, 'Beneficiary name is required'),
    beneficiaryAge: z.coerce.number().min(1, 'Valid age required'),
    beneficiaryRelationship: z.string().min(2, 'Relationship is required'),
    beneficiaryContact: z.string().optional().nullable(),
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

const RELATIONSHIP_OPTIONS = [
    'Parent',
    'Legal Guardian',
    'Spouse/Partner',
    'Child',
    'Sibling',
    'Other Family Member',
    'Friend',
    'Community/Religious Representative',
    'Healthcare Worker/Caregiver',
    'Platform Advocate'
];

export default function AdminStartProposalPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [relSelect, setRelSelect] = useState<string>('');

    useEffect(() => {
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
        mode: 'onChange',
        defaultValues: {
            beneficiaryRelationship: 'Platform Advocate'
        }
    });

    const selectedCategoryId = watch('categoryId');
    const selectedCategoryObj = categories.find(c => c.id === selectedCategoryId);
    const availableSubcategories = selectedCategoryObj?.subcategories || [];

    const onSubmit = async (data: StartFormValues) => {
        setIsLoading(true);
        try {
            // Note: isAssisted is explicitly passed as true to trigger admin logic
            const newProposal = await ApiService.proposals.create({
                ...data,
                categoryId: data.categoryId === '' ? null : data.categoryId,
                subcategoryId: data.subcategoryId === '' ? null : data.subcategoryId,
                isAssisted: true,
            } as any);
            router.push(`/admin/proposals/edit/${newProposal.id}/hook`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to initialize assisted cause');
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col gap-4 px-1 min-w-0">
                <Link href="/admin" className="w-fit">
                    <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-3xl">
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to dashboard
                    </Button>
                </Link>
                <div className="md:hidden">
                    <h1 className="text-lg font-bold tracking-tight text-foreground">Assisted Submission</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto min-w-0">
                <Card className="border-border/40 bg-card rounded-3xl shadow-sm overflow-hidden min-w-0">
                    <CardHeader className="p-6 md:p-8 border-b border-border/40 bg-primary/5">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                                <HeartHandshake className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg md:text-xl font-bold text-primary">Assisted Submission</CardTitle>
                                <CardDescription className="text-xs font-medium text-primary/80">
                                    Initialize a new cause on behalf of a beneficiary or guardian.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 pt-6 min-w-0">
                        <form method="POST" onSubmit={handleSubmit(onSubmit)} className="space-y-6 min-w-0">
                            <div className="space-y-5 min-w-0">
                                <Input
                                    label="Cause title"
                                    placeholder="e.g. Clean water for Owerri communities"
                                    {...register('title')}
                                    error={errors.title?.message}
                                    disabled={isLoading}
                                    className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0 items-end">
                                    <div className="w-full space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground/80 ml-1">Primary sector</label>
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

                                    <div className="w-full space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground/80 ml-1 flex items-center gap-1.5">
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

                                <div className="space-y-4 p-5 md:p-6 rounded-3xl bg-muted/10 border border-border/40 shadow-sm mt-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="h-4 w-4 text-primary" />
                                        <label className="text-xs font-bold text-foreground">Beneficiary Details</label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0 items-end">
                                        <Input
                                            label="Full legal name"
                                            placeholder="Legal name"
                                            {...register('beneficiaryName')}
                                            error={errors.beneficiaryName?.message}
                                            className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                        />
                                        <Input
                                            label="Current age"
                                            type="number"
                                            placeholder="Age"
                                            {...register('beneficiaryAge')}
                                            error={errors.beneficiaryAge?.message}
                                            className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                        />

                                        <div className="w-full space-y-1">
                                            <label className="text-xs font-bold text-muted-foreground/80 ml-1">Relationship to beneficiary</label>
                                            <Select
                                                value={relSelect || watch('beneficiaryRelationship')}
                                                onValueChange={(val) => {
                                                    setRelSelect(val);
                                                    if (val !== 'Other') {
                                                        setValue('beneficiaryRelationship', val, { shouldValidate: true });
                                                    } else {
                                                        setValue('beneficiaryRelationship', '', { shouldValidate: true });
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-12 rounded-2xl border-border/60 bg-card focus:bg-background font-medium text-sm">
                                                    <SelectValue placeholder="Select relationship..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-[22px] shadow-xl border-border/40">
                                                    {RELATIONSHIP_OPTIONS.map(opt => (
                                                        <SelectItem key={opt} value={opt} className="rounded-xl text-xs py-2.5 font-bold">{opt}</SelectItem>
                                                    ))}
                                                    <SelectItem value="Other" className="rounded-xl text-xs py-2.5 font-bold text-primary">Other / Custom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.beneficiaryRelationship && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.beneficiaryRelationship.message}</p>}
                                        </div>

                                        <Input
                                            label="Contact number (optional)"
                                            placeholder="Direct contact number"
                                            {...register('beneficiaryContact')}
                                            className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                        />

                                        {relSelect === 'Other' && (
                                            <div className="col-span-1 md:col-span-2">
                                                <Input
                                                    label="Specify relationship"
                                                    placeholder="Describe the relationship..."
                                                    {...register('beneficiaryRelationship')}
                                                    className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end mt-6 pt-6 border-t border-border/40">
                                <Button
                                    type="submit"
                                    className="w-full md:w-auto h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all gap-2 border-0 bg-primary hover:bg-primary/90 text-white px-8"
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
        </div>
    );
}