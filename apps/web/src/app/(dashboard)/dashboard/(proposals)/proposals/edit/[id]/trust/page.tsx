'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link'; // Added Link
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { Input } from '../../../../../../../../components/ui/input';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowLeft, Send, Loader2, ShieldCheck, Lock, ShieldAlert, ArrowRight } from 'lucide-react';
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
            // Fetch both the proposal and the global organization status
            const [proposalData, profileData] = await Promise.all([
                ApiService.proposals.get(proposalId),
                ApiService.organizations.getMe()
            ]);
            
            setProposal(proposalData);
            setOrgProfile(profileData);
        } catch (error) {
            toast.error('Could not load verification data.');
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
        toast.success('Your proposal has been submitted for review!');
        router.push('/dashboard/proposals');
    } catch (error: any) {
        const message = error.response?.data?.message || 'Submission failed. Ensure all sections are complete.';
        toast.error(message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const isVerified = orgProfile?.status === 'VERIFIED';

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin mr-3" /> Loading Verification Details...
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">The Trust</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-8 px-0">
        {!isVerified ? (
          /* --- LOCKED STATE: Nudge user to verify global profile first --- */
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-[32px] p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="h-20 w-20 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-500/5">
              <Lock className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Verification Required</h3>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
                To maintain the integrity of the Givar ledger, only verified organizations can launch public causes.
              </p>
            </div>
            <Link href="/dashboard/verify" className="inline-block">
              <Button className="rounded-xl h-12 px-8 shadow-lg shadow-primary/20 font-bold gap-2 active:scale-95 transition-all">
                Complete Organization Verification <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          /* --- VERIFIED STATE: Allow project-specific details and submission --- */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 p-5 bg-primary/5 border border-primary/20 rounded-2xl shadow-sm">
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                    <p className="font-bold text-foreground leading-none">Organization Verified</p>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium uppercase tracking-tight">Linked to: {orgProfile.legalName}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Input 
                    label="Internal Project Representative"
                    placeholder="e.g., Jane Doe"
                    value={organizationName || ''}
                    onChange={(e) => updateField('organizationName', e.target.value)}
                    disabled={isSubmitting}
                />
                <Input 
                    label="Direct Contact Phone"
                    placeholder="e.g., +234 800 000 0000"
                    value={contactPhone || ''}
                    onChange={(e) => updateField('contactPhone', e.target.value)}
                    disabled={isSubmitting}
                />
                <div className="md:col-span-2">
                     <Input 
                        label="Beneficiary Contact (Verification)"
                        placeholder="Name and Phone of a community leader or direct recipient"
                        value={beneficiaryContact || ''}
                        onChange={(e) => updateField('beneficiaryContact', e.target.value)}
                        disabled={isSubmitting}
                    />
                    <p className="text-[10px] text-muted-foreground mt-2 px-1 leading-relaxed">
                        <strong>Compliance Note:</strong> Givar audit teams may contact this individual to verify the on-ground impact before releasing tranches of the goal.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-primary" /> Project-Specific Permits
                </h3>
                <p className="text-sm text-muted-foreground">
                    Upload any local government letters, site photos, or specific authorization documents for this project.
                </p>
                <DocumentUploader />
            </div>
            
            <div className="flex justify-between items-center pt-8 border-t border-border">
                <Button variant="outline" className="rounded-xl h-11 px-6" onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/plan`)} disabled={isSubmitting}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Plan
                </Button>
                <Button 
                    size="lg" 
                    className="h-12 rounded-xl px-10 shadow-xl shadow-primary/20 font-bold gap-2" 
                    onClick={handleSubmitForReview}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" /> Processing...
                        </>
                    ) : (
                        <>
                            Submit for Review <Send className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}