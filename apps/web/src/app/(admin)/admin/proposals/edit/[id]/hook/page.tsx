'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProposalStore } from '../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../components/ui/card';
import { Button } from '../../../../../../../components/ui/button';
import { Input } from '../../../../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../../../components/ui/select';
import { Textarea } from '../../../../../../../components/ui/textarea';
import { RichTextEditor } from '../../../../../../../components/ui/rich-text-editor';
import { ApiService } from '../../../../../../../services/api';
import { ArrowRight, Loader2, User, Tag, HeartHandshake } from 'lucide-react';
import toast from 'react-hot-toast';
import { toTitleCase, toSentenceCase } from '../../../../../../../lib/utils/format';
import { Controller, useForm } from 'react-hook-form';

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

export default function AdminHookPage() {
    const router = useRouter();
    const params = useParams();
    const proposalId = params.id as string;

    const {
        title, shortDesc, description, personalMessage, location, endDate,
        categoryId, subcategoryId,
        beneficiaryName, beneficiaryAge, beneficiaryRelationship, beneficiaryContact,
        setProposal, updateField
    } = useProposalStore();

    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState<any[]>([]);
    const [relSelect, setRelSelect] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const currentState = useProposalStore.getState();

                const [proposalData, cats] = await Promise.all([
                    currentState.id !== proposalId ? ApiService.proposals.get(proposalId) : Promise.resolve(null),
                    ApiService.projects.getCategories()
                ]);
                setCategories(cats || []);

                if (proposalData) {
                    setProposal(proposalData);
                }

                const activeData = proposalData || currentState;

                updateField('isAssisted', true);

                if (activeData.beneficiaryRelationship) {
                    if (RELATIONSHIP_OPTIONS.includes(activeData.beneficiaryRelationship)) {
                        setRelSelect(activeData.beneficiaryRelationship);
                    } else {
                        setRelSelect('Other');
                    }
                }
            } catch (error) {
                toast.error("Draft failed to load");
                router.push('/admin/projects?tab=proposals');
            } finally {
                setIsLoading(false);
            }
        };

        if (proposalId) fetchData();
    }, [proposalId, setProposal, router, updateField]);

    const { control, setValue } = useForm({
        defaultValues: { categoryId, subcategoryId }
    });

    const selectedCategoryObj = categories.find(c => c.id === categoryId);
    const availableSubcategories = selectedCategoryObj?.subcategories || [];

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground min-w-0">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    const handleBlurTitle = () => { if (title) updateField('title', toTitleCase(title)); };
    const handleBlurShortDesc = () => { if (shortDesc) updateField('shortDesc', toSentenceCase(shortDesc)); };
    const handleBlurPersonalMessage = () => { if (personalMessage) updateField('personalMessage', toSentenceCase(personalMessage)); };
    const handleBlurLocation = () => { if (location) updateField('location', toTitleCase(location)); };

    const strippedDescription = description ? description.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim() : '';
    const titleValid = !!(title && title.trim().length >= 10);
    const locationValid = !!(location && location.trim().length >= 2);
    const descValid = strippedDescription.length >= 20;
    const beneficiaryValid = !!(beneficiaryName && beneficiaryName.trim().length >= 2);
    const relationshipValid = relSelect === 'Other'
        ? !!(beneficiaryRelationship && beneficiaryRelationship.trim())
        : !!relSelect;

    const isHookValid = titleValid && locationValid && descValid && beneficiaryValid && relationshipValid;

    return (
        <div className="space-y-6 w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="border-border/40 bg-card rounded-3xl overflow-hidden shadow-sm min-w-0">
                <CardHeader className="p-6 md:p-8 border-b border-border/40 bg-muted/10">
                    <div className="flex items-center gap-2 text-primary text-xs font-bold mb-1">
                        <HeartHandshake className="h-4 w-4" /> Assisted Submission
                    </div>
                    <CardTitle className="text-lg md:text-xl font-bold">Cause Narrative</CardTitle>
                    <CardDescription className="text-xs font-medium">
                        Define the mission, beneficiary details, and objectives for this assisted cause.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6 md:p-8 pt-6 space-y-8 min-w-0">
                    <div className="space-y-6 min-w-0">
                        <Input
                            label="Cause title *"
                            placeholder="e.g. Emergency medical care for Adebayo"
                            value={title}
                            onChange={(e) => updateField('title', e.target.value)}
                            onBlur={handleBlurTitle}
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
                                                updateField('categoryId', val);
                                                updateField('subcategoryId', null as any);
                                                setValue('subcategoryId', null as any, { shouldValidate: true });
                                            }}
                                            value={categoryId || undefined}
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
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                updateField('subcategoryId', val);
                                            }}
                                            value={subcategoryId || undefined}
                                            disabled={isLoading || !categoryId}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl border-border/40 bg-muted/20 focus:bg-background font-medium text-sm disabled:opacity-50">
                                                <SelectValue placeholder="Select focus..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-[22px] shadow-xl border-border/40">
                                                {availableSubcategories.length === 0 ? (
                                                    <div className="p-4 text-xs text-muted-foreground text-center italic">Select a sector first</div>
                                                ) : (
                                                    availableSubcategories.map((sub: any) => (
                                                        <SelectItem key={sub.id} value={sub.id} className="rounded-xl text-xs py-2.5 font-bold">{sub.name}</SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 p-5 md:p-6 rounded-3xl bg-muted/10 border border-border/40 shadow-sm mt-6">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-primary" />
                                <label className="text-xs font-bold text-foreground">Beneficiary Details</label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0 items-end">
                                <Input
                                    label="Beneficiary's full legal name *"
                                    placeholder="Legal name"
                                    value={beneficiaryName || ''}
                                    onChange={(e) => updateField('beneficiaryName', e.target.value)}
                                    className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                />
                                <Input
                                    label="Current age *"
                                    type="number"
                                    placeholder="Age"
                                    value={beneficiaryAge || ''}
                                    onChange={(e) => updateField('beneficiaryAge', parseInt(e.target.value) || null)}
                                    className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                />

                                <div className="w-full space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground/80 ml-1">Relationship to beneficiary *</label>
                                    <Select
                                        value={relSelect}
                                        onValueChange={(val) => {
                                            setRelSelect(val);
                                            if (val !== 'Other') {
                                                updateField('beneficiaryRelationship', val);
                                            } else {
                                                updateField('beneficiaryRelationship', '');
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
                                            <SelectItem value="Other" className="rounded-xl text-xs py-2.5 font-bold text-primary">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Input
                                    label="Beneficiary / representative phone (optional)"
                                    placeholder="Direct contact number"
                                    value={beneficiaryContact || ''}
                                    onChange={(e) => updateField('beneficiaryContact', e.target.value)}
                                    className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                />

                                {relSelect === 'Other' && (
                                    <div className="col-span-1 md:col-span-2">
                                        <Input
                                            label="Specify relationship *"
                                            placeholder="Describe the relationship..."
                                            value={beneficiaryRelationship || ''}
                                            onChange={(e) => updateField('beneficiaryRelationship', e.target.value)}
                                            className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <Textarea
                            label="Brief summary (optional)"
                            placeholder="A short summary of this cause (max 140 chars)..."
                            value={shortDesc || ''}
                            onChange={(e) => updateField('shortDesc', e.target.value)}
                            onBlur={handleBlurShortDesc}
                            maxLength={140}
                            className="h-24 rounded-2xl bg-muted/20 border-border/60 focus:bg-background resize-none"
                        />

                        <div className="space-y-1.5 min-w-0">
                            <label className="text-xs font-bold text-muted-foreground/80 ml-1">Cause description *</label>
                            <RichTextEditor
                                content={description || ''}
                                onChange={(content) => updateField('description', content)}
                                placeholder="Detail the circumstances, need, and plan for this assisted cause..."
                            />
                        </div>

                        <Textarea
                            label="Personal message from organizer (optional)"
                            placeholder="A human appeal for potential donors..."
                            value={personalMessage || ''}
                            onChange={(e) => updateField('personalMessage', e.target.value)}
                            onBlur={handleBlurPersonalMessage}
                            className="h-32 rounded-2xl bg-muted/20 border-border/60 focus:bg-background resize-none"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0 items-end">
                            <Input
                                label="Primary location *"
                                placeholder="e.g. Lagos, Nigeria"
                                value={location || ''}
                                onChange={(e) => updateField('location', e.target.value)}
                                onBlur={handleBlurLocation}
                                className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                            />

                            <Input
                                label="Deadline (optional)"
                                type="date"
                                value={endDate ? new Date(endDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    updateField('endDate', val ? new Date(val).toISOString() : null);
                                }}
                                className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-border/40 min-w-0 gap-4">
                        <div className="w-full sm:w-auto" />

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            {!isHookValid && (
                                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 text-center">
                                    Complete required fields
                                </span>
                            )}
                            <Button
                                disabled={!isHookValid || !categoryId || !subcategoryId}
                                className="w-full sm:w-auto h-12 rounded-3xl px-10 font-bold text-sm shadow-lg shadow-primary/20 gap-2 active:scale-[0.98] transition-all border-0 bg-primary hover:bg-primary/90 text-white min-w-0"
                                onClick={() => router.push(`/admin/proposals/edit/${proposalId}/media`)}
                            >
                                <span>Media</span> <ArrowRight className="h-4 w-4 shrink-0" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}