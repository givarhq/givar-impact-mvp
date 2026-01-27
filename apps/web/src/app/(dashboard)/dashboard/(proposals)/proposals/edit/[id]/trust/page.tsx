'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { Input } from '../../../../../../../../components/ui/input';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { DocumentUploader } from '../../../../../../../../components/features/proposals/document-uploader';
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

  useEffect(() => {
    ApiService.proposals.get(proposalId)
      .then(data => {
        setProposal(data);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error('Could not load proposal draft.');
        router.push('/dashboard/proposals');
      });
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

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground animate-pulse">
        Loading Verification Details...
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-lg font-bold tracking-tight text-foreground">Verification</CardTitle>
        <CardDescription>
          Verify your identity. This information is confidential and used only for verification by the Givar team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 px-0">
        
        {/* Contact Info */}
        <div className="grid md:grid-cols-2 gap-6">
            <Input 
                label="Organization Name (Optional)"
                placeholder="e.g., The Givar Foundation"
                value={organizationName || ''}
                onChange={(e) => updateField('organizationName', e.target.value)}
                disabled={isSubmitting}
            />
            <Input 
                label="Your Contact Phone"
                placeholder="e.g., +234 800 000 0000"
                value={contactPhone || ''}
                onChange={(e) => updateField('contactPhone', e.target.value)}
                disabled={isSubmitting}
            />
            <div className="md:col-span-2">
                 <Input 
                    label="Beneficiary Contact (Verification)"
                    placeholder="Name and Phone of a community leader or recipient"
                    value={beneficiaryContact || ''} // Use hoisted variable
                    onChange={(e) => updateField('beneficiaryContact', e.target.value)}
                    disabled={isSubmitting}
                />
                <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                    Givar admins may call this number to verify the legitimacy of the need.
                </p>
            </div>
        </div>

        {/* KYC Documents */}
        <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Verification Documents</h3>
            <p className="text-sm text-muted-foreground">
                Upload at least one document (e.g., CAC Certificate, Government ID, Proof of Address).
            </p>
            <DocumentUploader />
        </div>
        
        {/* Navigation & Submission */}
        <div className="flex justify-between items-center pt-8 border-t border-border">
            <Button variant="outline" className="rounded-xl h-11" onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/plan`)} disabled={isSubmitting}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button 
                size="lg" 
                className="h-11 rounded-xl shadow-lg shadow-primary/20" 
                onClick={handleSubmitForReview}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                    </>
                ) : (
                    <>
                        Submit for Review <Send className="ml-2 h-4 w-4" />
                    </>
                )}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}