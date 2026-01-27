'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, FileText, ExternalLink, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '../../ui/button';
import { ApiService } from '../../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Input } from '../../ui/input';
import toast from 'react-hot-toast';

export function VerificationReviewRow({ profile }: { profile: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleReview = async (status: 'VERIFIED' | 'REJECTED') => {
    if (status === 'REJECTED' && !feedback) {
        return toast.error("Please provide feedback for rejection.");
    }

    setIsLoading(true);
    try {
      await ApiService.organizations.review(profile.id, { status, feedback });
      toast.success(`Organization ${status.toLowerCase()} successfully`);
      router.refresh();
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setIsLoading(false);
    }
  };

  const viewDoc = async (key: string) => {
    try {
        // Reusing the proposal preview logic as it targets the same S3 bucket
        const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, 'admin-context'); 
        window.open(viewUrl, '_blank');
    } catch (e) {
        toast.error('Could not open document');
    }
  };

  return (
    <tr className="hover:bg-muted/30 transition-colors group">
      <td className="px-6 py-4 font-semibold text-foreground">
        {profile.legalName}
        <div className="text-[10px] text-muted-foreground font-mono mt-1 uppercase tracking-tight">
            ID: {profile.registrationNumber || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 text-xs text-muted-foreground">
        {profile.user?.email}
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
            {profile.documentKeys?.map((key: string, i: number) => (
                <button 
                    key={i} 
                    onClick={() => viewDoc(key)}
                    className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                    title="View Document"
                >
                    <FileText className="h-4 w-4" />
                </button>
            ))}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl">
                        <X className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl">
                    <DialogHeader>
                        <DialogTitle>Reject Verification</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <Input 
                            placeholder="Reason for rejection..." 
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="rounded-xl h-12"
                        />
                        <Button variant="destructive" className="w-full h-12 rounded-xl font-bold" onClick={() => handleReview('REJECTED')} disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Rejection'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Button 
                size="icon" 
                variant="ghost" 
                className="h-9 w-9 text-emerald-500 hover:bg-emerald-500/10 rounded-xl"
                onClick={() => handleReview('VERIFIED')}
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
            </Button>
        </div>
      </td>
    </tr>
  );
}