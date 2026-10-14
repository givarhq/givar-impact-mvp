'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useProposalStore } from '../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../components/ui/card';
import { Button } from '../../../../../../../components/ui/button';
import { Input } from '../../../../../../../components/ui/input';
import { ApiService } from '../../../../../../../services/api';
import { Send, Loader2, ShieldCheck, CheckCircle2, Landmark, FileText, AlertCircle, HeartHandshake, UploadCloud, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../../../../../../lib/utils/cn';
import { formatNumberInput, parseFormattedNumber } from '../../../../../../../lib/utils/format';
import { AnimatePresence, motion } from 'framer-motion';

export default function AdminTrustPage() {
    const router = useRouter();
    const params = useParams();
    const proposalId = params.id as string;

    const store = useProposalStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingAuth, setIsUploadingAuth] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [categoryName, setCategoryName] = useState('');

    // Legal Declarations States for Assisted Submissions
    const [hasBeneficiaryConsent, setHasBeneficiaryConsent] = useState(false);
    const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
    const [hasAgreedToNotifyExternalFunding, setHasAgreedToNotifyExternalFunding] = useState(false);
    const [hasAgreedToFee, setHasAgreedToFee] = useState(false);
    const [feePercentage, setFeePercentage] = useState<number>(2.5);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const currentState = useProposalStore.getState();
                let proposalData = currentState as any;

                if (currentState.id !== proposalId) {
                    proposalData = await ApiService.proposals.get(proposalId);
                    store.setProposal(proposalData);
                }

                setCategoryName(proposalData.category?.name?.toLowerCase() || '');

                const feeRule = await ApiService.fees.getPublicCurrent().catch(() => null);
                if (feeRule?.percentage !== undefined) {
                    setFeePercentage(feeRule.percentage);
                }
            } catch (error) {
                toast.error('Data synchronization failed');
                router.push('/admin/projects?tab=proposals');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [proposalId, store.setProposal, router]);

    // Deterministic Document Categorization based on storage path
    const authDocKey = store.kycDocuments.find(k => k.includes('/auth/'));
    const supportingDocKeys = store.kycDocuments.filter(k => !k.includes('/auth/'));

    const handleAuthUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size limit exceeded (max 10MB)');
            return;
        }

        setIsUploadingAuth(true);
        const toastId = toast.loading('Encrypting and attaching authorisation...');

        try {
            const { uploadUrl, key } = await ApiService.proposals.getUploadUrl({
                fileType: file.type,
                useCase: 'auth' as any,
            });

            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });

            if (authDocKey) {
                store.removeKycDocument(authDocKey);
            }

            store.addKycDocument(key);
            toast.success('Authorisation document securely attached', { id: toastId });
        } catch (error) {
            toast.error('Upload failed. Please try again.', { id: toastId });
        } finally {
            setIsUploadingAuth(false);
            e.target.value = '';
        }
    };

    const handleSupportingDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size limit exceeded (max 10MB)');
            return;
        }

        setIsUploadingDoc(true);
        const toastId = toast.loading('Encrypting supporting document...');

        try {
            const { uploadUrl, key } = await ApiService.proposals.getUploadUrl({
                fileType: file.type,
                useCase: 'kyc',
            });

            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });

            store.addKycDocument(key);
            toast.success('Supporting document uploaded', { id: toastId });
        } catch (error) {
            toast.error('Upload failed. Please try again.', { id: toastId });
        } finally {
            setIsUploadingDoc(false);
            e.target.value = '';
        }
    };

    const handleSubmitForReview = async () => {
        setIsSubmitting(true);
        store.updateField('status', 'SUBMITTED');

        const mappedGallery = store.gallery.map(item => ({
            id: item.id,
            url: item.key || item.url,
            type: item.type,
            caption: item.caption
        }));

        const mappedBudget = store.budgetBreakdown.map((b: any) => ({
            id: b.id,
            vendorId: b.vendorId,
            costType: b.costType,
            amount: b.amount,
            description: b.description,
            stage: b.stage === '' ? undefined : b.stage,
            payTo: b.payTo,
            vendorContact: b.vendorContact
        }));

        const mappedTimeline = store.executionTimeline.map((t: any) => ({
            id: t.id,
            phase: t.phase,
            estimatedDate: t.estimatedDate || 'TBD',
            deliverables: t.deliverables || ''
        }));

        const payload = {
            title: store.title,
            shortDesc: store.shortDesc,
            description: store.description,
            personalMessage: store.personalMessage,
            location: store.location,
            endDate: store.endDate,
            categoryId: store.categoryId,
            subcategoryId: store.subcategoryId,
            coverImage: store.coverImageKey || store.coverImage,
            gallery: mappedGallery,
            videoUrl: store.videoUrl,
            budgetBreakdown: mappedBudget,
            executionTimeline: mappedTimeline,
            riskAnalysis: store.riskAnalysis,
            kycDocuments: store.kycDocuments,
            beneficiaryName: store.beneficiaryName,
            beneficiaryAge: store.beneficiaryAge,
            beneficiaryRelationship: store.beneficiaryRelationship,
            beneficiaryContact: store.beneficiaryContact,
            hasPreCollectedFunds: store.hasPreCollectedFunds,
            isAssisted: true,
        };

        if (store.targetAmount !== undefined && store.targetAmount !== null) {
            (payload as any).targetAmount = store.targetAmount * 100;
        }

        if (store.preCollectedAmount !== undefined && store.preCollectedAmount !== null) {
            (payload as any).preCollectedAmount = store.preCollectedAmount * 100;
        }

        try {
            await ApiService.proposals.update(proposalId, payload);
            await ApiService.proposals.submit(proposalId);

            toast.success('Assisted cause submitted for review');
            router.push('/admin/projects?tab=proposals');
        } catch (error: any) {
            store.updateField('status', 'DRAFT');
            const message = error.response?.data?.message || 'Please verify all required fields.';
            toast.error(Array.isArray(message) ? message[0] : message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const strippedDescription = store.description ? store.description.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim() : '';

    const titleValid = !!(store.title && store.title.trim().length >= 10);
    const locationValid = !!(store.location && store.location.trim().length >= 2);
    const descValid = strippedDescription.length >= 20;

    const isHookValid = titleValid && locationValid && descValid;
    const isMediaValid = !!store.coverImage;

    const isBudgetValid = store.budgetBreakdown.length > 0 && store.budgetBreakdown.every(
        item => item.stage && item.costType && item.amount > 0 && item.description?.trim()
    );

    const isPlanValid = isBudgetValid;
    const hasAuthDoc = !!authDocKey;
    const isKycValid = hasAuthDoc;
    const isAllStepsValid = isHookValid && isMediaValid && isPlanValid && isKycValid;

    const canSubmit = !isSubmitting &&
        hasAgreedToTerms &&
        hasAgreedToNotifyExternalFunding &&
        (feePercentage === 0 || hasAgreedToFee) &&
        hasBeneficiaryConsent &&
        isAllStepsValid;

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground min-w-0">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    const getDynamicDocuments = () => {
        if (categoryName.includes('medical')) {
            return ['Medical report or diagnosis', 'Hospital invoice or estimate'];
        }
        if (categoryName.includes('education')) {
            return ['Admission letter or school approval', 'Fee invoice'];
        }
        return ['Quotation or estimate', 'Detailed project documentation'];
    };

    return (
        <div className="space-y-6 w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="border-border/40 bg-card rounded-3xl overflow-hidden shadow-sm min-w-0">
                <CardHeader className="p-6 md:p-8 border-b border-border/40 bg-primary/5">
                    <div className="flex items-center gap-2 text-primary text-xs font-bold mb-1">
                        <HeartHandshake className="h-4 w-4" /> Assisted Submission
                    </div>
                    <CardTitle className="text-lg md:text-xl font-bold">Authorisation & Declarations</CardTitle>
                    <CardDescription className="text-xs font-medium">
                        Provide supporting documentation and confirm beneficiary consent for this assisted cause.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6 md:p-8 pt-8 space-y-10 min-w-0">
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-0">

                        {/* Section 1: Supporting Documents & Authorisation */}
                        <div className="space-y-6">

                            {/* Slot 1: Mandatory Assisted Cause Authorisation */}
                            <div className="p-5 md:p-6 rounded-3xl bg-primary/[0.03] border border-primary/20 space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="space-y-0.5">
                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-primary" />
                                            Assisted Cause Submission Authorisation
                                        </h4>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            Signed authorization document confirming consent from beneficiary or guardian.
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest shrink-0">
                                        Mandatory
                                    </span>
                                </div>

                                {authDocKey ? (
                                    <div className="flex items-center justify-between p-4 bg-background border border-border/50 rounded-2xl shadow-sm">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                <FileText className="h-4.5 w-4.5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate">{authDocKey.split('/').pop()}</p>
                                                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                                                    <CheckCircle2 className="h-3 w-3" /> Encrypted and tagged as authorisation
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => store.removeKycDocument(authDocKey)}
                                            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label className={cn(
                                        "flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-primary/30 rounded-2xl cursor-pointer bg-background/50 hover:bg-primary/5 hover:border-primary/50 transition-all text-center p-4",
                                        isUploadingAuth && "opacity-50 cursor-wait pointer-events-none"
                                    )}>
                                        {isUploadingAuth ? (
                                            <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                                        ) : (
                                            <UploadCloud className="h-6 w-6 text-primary mb-2" />
                                        )}
                                        <span className="text-xs font-bold text-foreground">Upload Signed Authorisation Document</span>
                                        <span className="text-[10px] text-muted-foreground font-medium mt-0.5">PDF or image up to 10MB</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
                                            onChange={handleAuthUpload}
                                            disabled={isUploadingAuth}
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Slot 2: General Category Invoices & Quotes */}
                            <div className="space-y-4 pt-2">
                                <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 shadow-inner">
                                    <p className="text-xs font-bold text-foreground mb-2 tracking-widest uppercase">Recommended Category Evidence:</p>
                                    <ul className="space-y-1.5">
                                        {getDynamicDocuments().map((doc, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{doc}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-3">
                                    <label className={cn(
                                        "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border/60 rounded-2xl cursor-pointer bg-muted/5 hover:bg-muted/20 transition-all text-center p-4",
                                        isUploadingDoc && "opacity-50 cursor-wait pointer-events-none"
                                    )}>
                                        {isUploadingDoc ? (
                                            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin mb-1.5" />
                                        ) : (
                                            <UploadCloud className="h-5 w-5 text-muted-foreground mb-1.5" />
                                        )}
                                        <span className="text-xs font-bold text-foreground">Attach Procurement Quotes & Invoices</span>
                                        <span className="text-[10px] text-muted-foreground font-medium mt-0.5">PDF, DOCX, PNG, JPG</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
                                            onChange={handleSupportingDocUpload}
                                            disabled={isUploadingDoc}
                                        />
                                    </label>

                                    {supportingDocKeys.length > 0 && (
                                        <div className="space-y-2 pt-1">
                                            {supportingDocKeys.map((key) => (
                                                <div key={key} className="flex items-center justify-between p-3 bg-card border border-border/40 rounded-2xl shadow-sm">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="h-8 w-8 rounded-xl bg-muted/50 text-muted-foreground flex items-center justify-center shrink-0">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-xs font-medium text-foreground truncate">{key.split('/').pop()}</span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => store.removeKycDocument(key)}
                                                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Pre-Collected Funds Declaration */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-border/40 pb-3 px-1">
                                <Landmark className="h-4.5 w-4.5 text-primary" />
                                <h3 className="font-bold text-base text-foreground">Pre-Collected Funds Declaration</h3>
                            </div>

                            <div className="flex items-center justify-between p-5 rounded-3xl border border-border/40 bg-card hover:bg-muted/10 transition-colors shadow-sm">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-foreground">Have funds already been raised outside Givar?</h4>
                                    <p className="text-[11px] text-muted-foreground font-medium max-w-[280px]">
                                        Provides additional context regarding prior financial assistance received.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => store.updateField('hasPreCollectedFunds', !store.hasPreCollectedFunds)}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
                                        store.hasPreCollectedFunds ? "bg-primary" : "bg-muted-foreground/30"
                                    )}
                                >
                                    <span className={cn(
                                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                        store.hasPreCollectedFunds ? "translate-x-5" : "translate-x-0"
                                    )} />
                                </button>
                            </div>

                            <AnimatePresence>
                                {store.hasPreCollectedFunds && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-6 rounded-3xl bg-muted/20 border border-border/40 space-y-5 overflow-hidden"
                                    >
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-muted-foreground tracking-widest ml-1">Estimated amount received (optional) (NGN)</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-sm">₦</span>
                                                <Input
                                                    value={store.preCollectedAmount === null ? '' : formatNumberInput(String(store.preCollectedAmount))}
                                                    onChange={(e) => store.updateField('preCollectedAmount', e.target.value === '' ? null : Number(parseFormattedNumber(e.target.value)))}
                                                    className="pl-11 h-12 rounded-2xl bg-background border-border/60 focus:bg-white tabular-nums font-bold"
                                                    placeholder="0"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Section 3: Legal & Consent Declarations */}
                        <div className="space-y-4 pt-6 border-t border-border/40">
                            <div className="flex items-center gap-3 pb-3 px-1">
                                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                                <h3 className="font-bold text-base text-foreground">Authorisation & Consent Confirmations</h3>
                            </div>

                            <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/60 bg-muted/10 transition-colors">
                                <input
                                    type="checkbox"
                                    className="mt-0.5 h-4 w-4 rounded-[4px] border-border/60 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                    checked={hasBeneficiaryConsent}
                                    onChange={(e) => setHasBeneficiaryConsent(e.target.checked)}
                                    disabled={isSubmitting}
                                />
                                <span className="text-sm font-medium text-foreground leading-relaxed select-none">
                                    I confirm that the beneficiary (or their legal guardian) has provided informed consent for this fundraising effort and that the signed Assisted Cause Submission Authorisation is on file.
                                </span>
                            </div>

                            <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/60 bg-muted/10 transition-colors">
                                <input
                                    type="checkbox"
                                    className="mt-0.5 h-4 w-4 rounded-[4px] border-border/60 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                    checked={hasAgreedToNotifyExternalFunding}
                                    onChange={(e) => setHasAgreedToNotifyExternalFunding(e.target.checked)}
                                    disabled={isSubmitting}
                                />
                                <span className="text-sm font-medium text-foreground leading-relaxed select-none">
                                    I confirm that the beneficiary (or their legal guardian) has agreed to notify Givar within 48 hours if any item listed on this cause receives external funding or support.
                                </span>
                            </div>

                            {feePercentage > 0 && (
                                <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/60 bg-muted/10 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 h-4 w-4 rounded-[4px] border-border/60 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                        checked={hasAgreedToFee}
                                        onChange={(e) => setHasAgreedToFee(e.target.checked)}
                                        disabled={isSubmitting}
                                    />
                                    <span className="text-sm font-medium text-foreground leading-relaxed select-none">
                                        I confirm that the beneficiary (or their legal guardian) has been informed and understands that Givar applies an operational support fee of {feePercentage}% for cause verification, implementation oversight, and platform operations.
                                    </span>
                                </div>
                            )}

                            <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/60 bg-muted/10 transition-colors">
                                <input
                                    type="checkbox"
                                    className="mt-0.5 h-4 w-4 rounded-[4px] border-border/60 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                    checked={hasAgreedToTerms}
                                    onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                                    disabled={isSubmitting}
                                />
                                <div className="space-y-1.5 select-none">
                                    <span className="text-sm font-medium text-foreground leading-relaxed block">
                                        I confirm that the beneficiary (or their legal guardian) has reviewed and agreed to the <Link href="/legal/agreement" className="text-primary hover:underline" target="_blank">Cause Organiser Agreement</Link>, and that the signed authorisation authorising this submission is on file.
                                    </span>
                                    <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                                        <li>Organiser responsibilities and permissions</li>
                                        <li>Information accuracy and audit verification</li>
                                        <li>Direct vendor disbursement protocol</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Incomplete Validation Banner */}
                        {!isAllStepsValid && (
                            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 mb-6 space-y-2 animate-in fade-in">
                                <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" /> Incomplete sections
                                </p>
                                <ul className="text-xs text-amber-700 font-medium list-disc pl-5 space-y-1">
                                    {!titleValid && <li>The cause title must be at least 10 characters.</li>}
                                    {!locationValid && <li>A primary location is required.</li>}
                                    {!descValid && <li>The cause description must be at least 20 characters.</li>}
                                    {!isMediaValid && <li>A primary hero image is required in the media section.</li>}
                                    {!isPlanValid && <li>All required budget fields must be fully completed.</li>}
                                    {!hasAuthDoc && <li>The signed Assisted Cause Submission Authorisation must be uploaded.</li>}
                                </ul>
                            </div>
                        )}

                        {/* Navigation & Submit Controls */}
                        <div className="flex items-center justify-between pt-6 border-t border-border/40 min-w-0 gap-4">
                            <Button
                                variant="outline"
                                className="rounded-3xl h-12 px-6 text-xs font-bold border-border/60 text-muted-foreground hover:bg-muted transition-all active:scale-95 min-w-0"
                                onClick={() => router.push(`/admin/proposals/edit/${proposalId}/plan`)}
                                disabled={isSubmitting}
                            >
                                <span>Back</span>
                            </Button>
                            <Button
                                className="h-12 rounded-3xl px-10 font-bold text-sm shadow-lg shadow-primary/20 gap-2 active:scale-[0.98] transition-all border-0 bg-primary text-white hover:bg-primary/90 min-w-0"
                                onClick={handleSubmitForReview}
                                disabled={!canSubmit}
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Send className="h-4 w-4 shrink-0" />}
                                <span className="truncate">Submit Assisted Cause</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}