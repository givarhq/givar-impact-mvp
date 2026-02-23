'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { Input } from '../../../../../../../../components/ui/input';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowLeft, Send, Loader2, ShieldCheck, Lock, Clock, CheckCircle2 } from 'lucide-react';
import { DocumentUploader } from '../../../../../../../../components/features/proposals/document-uploader';
import { OrganizationProfile } from '../../../../../../../../types';
import toast from 'react-hot-toast';

export default function TrustPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;

  const {
    organizationName,
    contactPhone,
    beneficiaryContact,
    setProposal,
    updateField
  } = useProposalStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgProfile, setOrgProfile] = useState<OrganizationProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proposalData, profileData] = await Promise.all([
          ApiService.proposals.get(proposalId),
          ApiService.organizations.getMe()
        ]);
        setProposal(proposalData);
        setOrgProfile(profileData);
      } catch (error) {
        toast.error('Data synchronization failed');
        router.push('/dashboard/proposals');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [proposalId, setProposal, router]);

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    try {
      await ApiService.proposals.submit(proposalId);
      toast.success('Submitted for formal review');
      router.push('/dashboard/proposals');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Please verify all required fields.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVerified = orgProfile?.status === 'VERIFIED';
  const isKycPending = orgProfile?.status === 'PENDING';

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground min-w-0">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">

      <Card className="border-border/40 bg-card rounded-3xl overflow-hidden shadow-sm min-w-0">
        <CardHeader className="p-6 md:p-8 border-b border-border/40 bg-muted/10">
          <div className="flex items-center gap-2 text-primary mb-1 min-w-0">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span className="text-[11px] font-bold  tracking-[0.2em]">Compliance</span>
          </div>
          <CardTitle className="text-lg md:text-xl font-bold">Identity Verification</CardTitle>
          <CardDescription className="text-xs font-medium">
            Establishing trust ensures that donors can support your cause with maximum transparency.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8 pt-8 space-y-8 min-w-0">
          {isVerified ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-0">
              <div className="flex items-center gap-4 p-5 rounded-[24px] bg-primary/5 border border-primary/20 shadow-inner min-w-0">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0 border border-primary/10">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate leading-none mb-1.5">Organization Verified</p>
                  <p className="text-[11px] text-primary font-bold  tracking-widest truncate">{orgProfile?.legalName}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0">
                <Input
                  label="Internal representative"
                  placeholder="Full name of project lead"
                  value={organizationName || ''}
                  onChange={(e) => updateField('organizationName', e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                />
                <Input
                  label="Direct contact phone"
                  placeholder="+234..."
                  value={contactPhone || ''}
                  onChange={(e) => updateField('contactPhone', e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                />
                <div className="md:col-span-2 min-w-0">
                  <Input
                    label="Local community contact"
                    placeholder="Name & phone of a local beneficiary or leader"
                    value={beneficiaryContact || ''}
                    onChange={(e) => updateField('beneficiaryContact', e.target.value)}
                    disabled={isSubmitting}
                    className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                  />
                </div>
              </div>

              <div className="space-y-4 min-w-0 pt-6 border-t border-border/40">
                <div className="px-1 space-y-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">Project Permits</h3>
                  <p className="text-xs text-muted-foreground font-medium">Upload letters of authority or local government permits for this cause.</p>
                </div>
                <div className="min-w-0">
                  <DocumentUploader />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-border/40 min-w-0 gap-4">
                <Button variant="outline" className="rounded-3xl h-12 px-6 text-xs font-bold border-border/60 text-muted-foreground hover:bg-muted transition-all active:scale-95 min-w-0" onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/plan`)} disabled={isSubmitting}>
                  <ArrowLeft className="mr-2 h-4 w-4 shrink-0" /> <span className="truncate">Back</span>
                </Button>
                <Button
                  className="h-12 rounded-3xl px-10 font-bold text-xs tracking-widest shadow-lg shadow-primary/20 gap-2 active:scale-[0.98] transition-all border-0 min-w-0"
                  onClick={handleSubmitForReview}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Send className="h-4 w-4 shrink-0" />}
                  <span className="truncate">Submit for Review</span>
                </Button>
              </div>
            </div>
          ) : isKycPending ? (
            <div className="py-12 text-center space-y-6 min-w-0">
              <div className="h-16 w-16 bg-amber-50 text-amber-500 rounded-[24px] flex items-center justify-center mx-auto border border-amber-100 shadow-inner">
                <Clock className="h-8 w-8 animate-pulse" />
              </div>
              <div className="space-y-2 max-w-xs mx-auto min-w-0">
                <h3 className="text-lg font-bold tracking-tight">Identity Audit in Progress</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Your organization documents are being verified. You can submit this cause once your identity node is confirmed.
                </p>
              </div>
              <Link href="/dashboard/settings?tab=org" className="block">
                <Button variant="outline" className="rounded-3xl h-11 px-8 font-bold text-xs border-border/60 hover:bg-muted transition-all active:scale-95">
                  Check Verification Status
                </Button>
              </Link>
            </div>
          ) : (
            <div className="py-12 text-center space-y-6 min-w-0">
              <div className="h-16 w-16 bg-muted/50 text-muted-foreground rounded-[24px] flex items-center justify-center mx-auto border border-border/40 shadow-inner">
                <Lock className="h-8 w-8" />
              </div>
              <div className="space-y-2 max-w-xs mx-auto min-w-0">
                <h3 className="text-lg font-bold tracking-tight">Verification Required</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Only verified organizations can launch public impact causes on the platform.
                </p>
              </div>
              <Link href="/dashboard/settings?tab=org" className="block">
                <Button className="rounded-3xl h-12 px-10 font-bold text-xs shadow-lg shadow-primary/20 transition-all active:scale-95 border-0">
                  Complete Verification
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}