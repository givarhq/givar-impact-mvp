'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { Input } from '../../../../../../../../components/ui/input';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowLeft, Send, Loader2, ShieldCheck, CheckCircle2, Building, Landmark, FileText } from 'lucide-react';
import { DocumentUploader } from '../../../../../../../../components/features/proposals/document-uploader';
import { ImageUploader } from '../../../../../../../../components/features/proposals/media-uploader';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const proposalData = await ApiService.proposals.get(proposalId);
        store.setProposal(proposalData);
        setCategoryName(proposalData.category?.name?.toLowerCase() || '');
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

    try {
      await ApiService.proposals.submit(proposalId);
      toast.success('Submitted for formal review');
      router.push(`/dashboard/proposals/status/${proposalId}`);
    } catch (error: any) {
      store.updateField('status', 'DRAFT');
      const message = error.response?.data?.message || 'Please verify all required fields.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showFeedback = store.status === 'CHANGES_REQUESTED';
  const isThirdParty = store.beneficiaryRelationship !== 'Self' && store.beneficiaryRelationship !== null && store.beneficiaryRelationship !== '';
  const canSubmit = !isSubmitting && hasAgreedToTerms && (!isThirdParty || hasBeneficiaryConsent);

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
          <CardTitle className="text-lg md:text-xl font-bold">Execution Partners & Evidence</CardTitle>
          <CardDescription className="text-xs font-medium">
            Provide verifiable details for the execution partners and upload structural evidence for this cause.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8 pt-8 space-y-10 min-w-0">
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-0">

            {/* SECTION 1: VENDOR DETAILS */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border/40 pb-3 px-1">
                <Building className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Vendor Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Input
                    label="Organisation or Provider Name"
                    placeholder="e.g. City General Hospital, ABC Drilling"
                    value={store.vendorName || ''}
                    onChange={(e) => store.updateField('vendorName', e.target.value)}
                    disabled={isSubmitting}
                    className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                  />
                </div>
                <Input
                  label="Contact Person"
                  placeholder="Representative name"
                  value={store.vendorContactPerson || ''}
                  onChange={(e) => store.updateField('vendorContactPerson', e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                />
                <Input
                  label="Phone"
                  placeholder="Vendor contact number"
                  value={store.vendorPhone || ''}
                  onChange={(e) => store.updateField('vendorPhone', e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                />
                <Input
                  label="Email"
                  placeholder="Vendor email address"
                  value={store.vendorEmail || ''}
                  onChange={(e) => store.updateField('vendorEmail', e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                />
                <Input
                  label="Address"
                  placeholder="Physical location of vendor"
                  value={store.vendorAddress || ''}
                  onChange={(e) => store.updateField('vendorAddress', e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                />
              </div>
            </div>

            {/* SECTION 2: EVIDENCE AND VERIFICATION DOCUMENTS */}
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

            {/* SECTION 3: PRE-COLLECTED FUNDS DECLARATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-border/40 pb-3 px-1">
                <Landmark className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Pre-Collected Funds Declaration</h3>
              </div>

              <div className="flex items-center justify-between p-5 rounded-3xl border border-border/40 bg-card hover:bg-muted/10 transition-colors shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">Have funds already been raised outside Givar?</h4>
                  <p className="text-[11px] text-muted-foreground font-medium max-w-[280px]">Previously raised funds must be verified before inclusion in the progress tracker.</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground tracking-widest ml-1">Amount already raised (NGN)</label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-sm">₦</span>
                          <Input
                            value={store.preCollectedAmount === null ? '' : formatNumberInput(String(store.preCollectedAmount))}
                            onChange={(e) => store.updateField('preCollectedAmount', Number(parseFormattedNumber(e.target.value)))}
                            className="pl-11 h-12 rounded-2xl bg-background border-border/60 focus:bg-white tabular-nums font-bold"
                            placeholder="0"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground tracking-widest ml-1">Where funds are held</label>
                        <Input
                          value={store.preCollectedHeldAt || ''}
                          onChange={(e) => store.updateField('preCollectedHeldAt', e.target.value)}
                          className="h-12 rounded-2xl bg-background border-border/60 focus:bg-white"
                          placeholder="e.g. Zenith Bank, Personal Wallet"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground tracking-widest ml-1">Proof upload</label>
                      {store.preCollectedProofKey ? (
                        <div className="flex items-center justify-between p-4 bg-background border border-border/60 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            <span className="text-sm font-bold text-foreground">Proof Attached</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => store.updateField('preCollectedProofKey', null)} className="text-xs font-bold text-destructive hover:bg-destructive/10 rounded-xl">Remove</Button>
                        </div>
                      ) : (
                        <div className="h-24">
                          <ImageUploader
                            label="Upload screenshot or receipt"
                            useCase="docs"
                            onUploadComplete={(data) => store.updateField('preCollectedProofKey', data.key)}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SECTION 4: LEGAL & CONSENT DECLARATIONS */}
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
                  checked={hasAgreedToTerms}
                  onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                  disabled={isSubmitting}
                />
                <div className="space-y-1.5 select-none">
                  <span className="text-sm font-medium text-foreground leading-relaxed block">
                    I agree to the <Link href="/legal/agreement" className="text-primary hover:underline">Cause Organiser Agreement</Link>.
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

            {/* NAVIGATION AND SUBMIT */}
            <div className="flex items-center justify-between pt-6 border-t border-border/40 min-w-0 gap-4">
              <Button variant="outline" className="rounded-3xl h-12 px-6 text-xs font-bold border-border/60 text-muted-foreground hover:bg-muted transition-all active:scale-95 min-w-0" onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/plan`)} disabled={isSubmitting}>
                <span>Back</span>
              </Button>
              <Button
                className="h-12 rounded-3xl px-10 font-bold text-sm shadow-lg shadow-primary/20 gap-2 active:scale-[0.98] transition-all border-0 min-w-0"
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

      {/* Gated Feedback Thread: Only shown if revisions are requested */}
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