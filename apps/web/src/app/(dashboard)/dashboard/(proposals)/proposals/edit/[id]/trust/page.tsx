'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { Input } from '../../../../../../../../components/ui/input';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowLeft, Send, Loader2, ShieldCheck, CheckCircle2, Landmark, FileText, AlertCircle } from 'lucide-react';
import { DocumentUploader } from '../../../../../../../../components/features/proposals/document-uploader';
import toast from 'react-hot-toast';
import { cn } from '../../../../../../../../lib/utils/cn';
import { formatNumberInput, parseFormattedNumber } from '../../../../../../../../lib/utils/format';
import { AnimatePresence, motion } from 'framer-motion';
import { FeedbackThread } from 'apps/web/src/components/features/communication/feedback-thread';

export default function TrustPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;

  const store = useProposalStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  // Legal Consent States
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

        // Fetch dynamic fee rule from the governance engine
        const feeRule = await ApiService.fees.getPublicCurrent().catch(() => null);
        if (feeRule?.percentage !== undefined) {
          setFeePercentage(feeRule.percentage);
        }

      } catch (error) {
        toast.error('Data synchronization failed');
        router.push('/dashboard/proposals');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [proposalId, store.setProposal, router]);

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    store.updateField('status', 'SUBMITTED');

    // Bulletproof Payload Mapping: Strip out all internal UI states (like isNewDraft)
    const mappedGallery = store.gallery.map(item => ({
      id: item.id,
      url: item.key || item.url, // Ensure we send the permanent key, not a JIT blob
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
    };

    if (store.targetAmount !== undefined && store.targetAmount !== null) {
      (payload as any).targetAmount = store.targetAmount * 100;
    }

    if (store.preCollectedAmount !== undefined && store.preCollectedAmount !== null) {
      (payload as any).preCollectedAmount = store.preCollectedAmount * 100;
    }

    try {
      // 1. Flush the exact current state to the DB immediately
      await ApiService.proposals.update(proposalId, payload);
      // 2. Submit the synchronized proposal
      await ApiService.proposals.submit(proposalId);

      toast.success('Submitted for formal review');
      router.push(`/dashboard/proposals/status/${proposalId}`);
    } catch (error: any) {
      store.updateField('status', 'DRAFT');
      const message = error.response?.data?.message || 'Please verify all required fields.';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showFeedback = store.status === 'CHANGES_REQUESTED';
  const isThirdParty = store.beneficiaryRelationship !== 'Self' && store.beneficiaryRelationship !== null && store.beneficiaryRelationship !== '';

  // Cross-Step Validation Gates (Refined for Granular UI Feedback)
  const strippedDescription = store.description ? store.description.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim() : '';

  const titleValid = !!(store.title && store.title.trim().length >= 10);
  const locationValid = !!(store.location && store.location.trim().length >= 2);
  const descValid = strippedDescription.length >= 20;

  const isHookValid = titleValid && locationValid && descValid;
  const isMediaValid = !!store.coverImage;

  // Strict Validation: Ensure budget has stages and valid amounts
  const isBudgetValid = store.budgetBreakdown.length > 0 && store.budgetBreakdown.every(
    item => item.stage && item.costType && item.amount > 0 && item.description?.trim()
  );

  const isPlanValid = isBudgetValid;

  const isKycValid = store.kycDocuments && store.kycDocuments.length > 0;

  const isAllStepsValid = isHookValid && isMediaValid && isPlanValid && isKycValid;
  const canSubmit = !isSubmitting && hasAgreedToTerms && hasAgreedToNotifyExternalFunding && hasAgreedToFee && (!isThirdParty || hasBeneficiaryConsent) && isAllStepsValid;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground min-w-0">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const getDynamicDocuments = () => {
    if (categoryName.includes('medical')) {
      return ['Medical report or diagnosis', 'Hospital invoice or estimate', 'Treatment recommendation or admission letter'];
    }
    if (categoryName.includes('education')) {
      return ['Admission letter or school board approval', 'Fee invoice'];
    }
    if (categoryName.includes('community')) {
      return ['Quotation or estimate', 'Project description'];
    }
    return ['Quotation or estimate', 'Project description'];
  };

  return (
    <div className="space-y-6 w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">

      <Card className="border-border/40 bg-card rounded-3xl overflow-hidden shadow-sm min-w-0">
        <CardHeader className="p-6 md:p-8 border-b border-border/40 bg-muted/10">
          <CardTitle className="text-lg md:text-xl font-bold">Evidence & Declarations</CardTitle>
          <CardDescription className="text-xs font-medium">
            Provide verifiable structural evidence for this cause and confirm your legal declarations.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8 pt-8 space-y-10 min-w-0">
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-0">

            {/* SECTION 1: EVIDENCE AND VERIFICATION DOCUMENTS */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border/40 pb-3 px-1">
                <FileText className="h-4.5 w-4.5 text-primary" />
                <div className="space-y-0.5">
                  <h3 className="font-bold text-base text-foreground">Cause Evidence & Procurement Quotes</h3>
                  <p className="text-xs text-muted-foreground font-medium">Requirements generated dynamically for the {categoryName} category.</p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-muted/20 border border-border/40 shadow-inner mb-6">
                <p className="text-xs font-bold text-foreground mb-3 tracking-widest uppercase">Required Uploads:</p>
                <ul className="space-y-2">
                  {getDynamicDocuments().map((doc, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <CheckCircle2 className="h-3 w-3 text-primary" /> {doc}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="min-w-0">
                <DocumentUploader />
              </div>
            </div>

            {/* SECTION 2: PRE-COLLECTED FUNDS DECLARATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border/40 pb-3 px-1">
                <Landmark className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Pre-Collected Funds Declaration</h3>
              </div>

              <div className="flex items-center justify-between p-5 rounded-3xl border border-border/40 bg-card hover:bg-muted/10 transition-colors shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">Have funds already been raised outside Givar?</h4>
                  <p className="text-[11px] text-muted-foreground font-medium max-w-[280px]">This helps provide additional context about support already received for the cause.</p>
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

            {/* SECTION 3: LEGAL & CONSENT DECLARATIONS */}
            <div className="space-y-4 pt-6 border-t border-border/40">
              <div className="flex items-center gap-3 pb-3 px-1">
                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Declarations & Agreements</h3>
              </div>

              {isThirdParty && (
                <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/60 bg-muted/10 transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded-[4px] border-border/60 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                    checked={hasBeneficiaryConsent}
                    onChange={(e) => setHasBeneficiaryConsent(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span className="text-sm font-medium text-foreground leading-relaxed select-none">
                    I confirm the beneficiary (or their legal guardian) is aware of and has authorised this fundraising effort.
                  </span>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/60 bg-muted/10 transition-colors">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded-[4px] border-border/60 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                  checked={hasAgreedToNotifyExternalFunding}
                  onChange={(e) => setHasAgreedToNotifyExternalFunding(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className="text-sm font-medium text-foreground leading-relaxed select-none">
                  I agree to notify Givar within 48 hours if any item listed on this cause is fully funded or partially funded through another source.
                </span>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/60 bg-muted/10 transition-colors">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded-[4px] border-border/60 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                  checked={hasAgreedToFee}
                  onChange={(e) => setHasAgreedToFee(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className="text-sm font-medium text-foreground leading-relaxed select-none">
                  I understand that Givar applies a {feePercentage}% Operational Support Fee on donations for cause verification, implementation oversight, and platform operations. This fee is charged separately and does not reduce donations made to my cause.
                </span>
              </div>

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
                    I agree to the <Link href="/legal/agreement" className="text-primary hover:underline" target="_blank">Cause Organiser Agreement</Link>.
                  </span>
                  <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                    <li>Organiser responsibilities</li>
                    <li>Information accuracy obligations</li>
                    <li>Platform rights to pause or remove causes</li>
                    <li>Vendor payment structure</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Validation Banner (Refined Feedback) */}
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
                  {!isKycValid && <li>At least one piece of cause evidence or procurement quote must be uploaded.</li>}
                </ul>
              </div>
            )}

            {/* NAVIGATION AND SUBMIT */}
            <div className="flex items-center justify-between pt-6 border-t border-border/40 min-w-0 gap-4">
              <Button variant="outline" className="rounded-3xl h-12 px-6 text-xs font-bold border-border/60 text-muted-foreground hover:bg-muted transition-all active:scale-95 min-w-0" onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/plan`)} disabled={isSubmitting}>
                <span>Back</span>
              </Button>
              <Button
                className="h-12 rounded-3xl px-10 font-bold text-sm shadow-lg shadow-primary/20 gap-2 active:scale-[0.98] transition-all border-0 bg-primary text-white hover:bg-primary/90 min-w-0"
                onClick={handleSubmitForReview}
                disabled={!canSubmit}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Send className="h-4 w-4 shrink-0" />}
                <span className="truncate">Submit Cause</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gated Feedback Thread */}
      {showFeedback && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <FeedbackThread
            proposalId={proposalId}
            title="Verification Updates"
          />
        </div>
      )}
    </div>
  );
}
