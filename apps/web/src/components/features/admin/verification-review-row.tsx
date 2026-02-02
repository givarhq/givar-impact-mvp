'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, FileText, Loader2, CheckCircle2, ShieldAlert, History } from 'lucide-react';
import { Button } from '../../ui/button';
import { ApiService } from '../../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';

export function VerificationReviewRow({ profile }: { profile: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleReview = async (status: 'VERIFIED' | 'REJECTED') => {
    if (status === 'REJECTED' && !feedback) {
      return toast.error("Please provide feedback for rejection.");
    }

    setIsLoading(true);
    try {
      await ApiService.organizations.review(profile.id, { status, feedback });
      toast.success(`Organization ${status.toLowerCase()} successfully`);
      setIsProcessed(true);
      router.refresh();
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setIsLoading(false);
    }
  };

  const viewDoc = async (key: string) => {
    try {
      const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, 'admin-context');
      window.open(viewUrl, '_blank');
    } catch (e) {
      toast.error('Could not open document');
    }
  };

  const isHandled = isProcessed || profile.status !== 'PENDING';

  return (
    <tr className={cn(
      "transition-colors group",
      isHandled ? "bg-muted/10 opacity-80" : "hover:bg-muted/30"
    )}>
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <span className="font-semibold text-foreground leading-none">{profile.legalName}</span>
          <span className="text-[10px] text-muted-foreground font-mono mt-1 uppercase tracking-tight">
            ID: {profile.registrationNumber || 'N/A'}
          </span>
        </div>
      </td>
      <td className="px-6 py-5 text-xs text-muted-foreground font-medium">
        {profile.user?.email}
      </td>
      <td className="px-6 py-5">
        <div className="flex gap-2">
          {profile.documentKeys?.map((key: string, i: number) => (
            <button
              key={i}
              onClick={() => viewDoc(key)}
              className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
              title="View Document"
            >
              <FileText className="h-4.5 w-4.5" />
            </button>
          ))}
        </div>
      </td>
      <td className="px-6 py-5 text-right">
        <div className="flex justify-end items-center gap-3">
          {/* SOTA FIX: Toggle between Actions and Status Status */}
          {!isHandled ? (
            <div className="flex gap-2 animate-in fade-in zoom-in duration-300">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl" disabled={isLoading}>
                    <X className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[32px] p-8">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Reject Verification</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <Input placeholder="Reason for rejection..." value={feedback} onChange={(e) => setFeedback(e.target.value)} className="rounded-xl h-12" />
                    <Button variant="destructive" className="w-full h-14 rounded-2xl font-bold text-base" onClick={() => handleReview('REJECTED')} disabled={isLoading}>
                      {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirm Rejection'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button size="icon" variant="ghost" className="h-10 w-10 text-emerald-500 hover:bg-emerald-500/10 rounded-xl" onClick={() => handleReview('VERIFIED')} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <Check className="h-5 w-5" />}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-500">
              <Badge className={cn(
                "h-8 px-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border-0",
                profile.status === 'VERIFIED' ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
              )}>
                {profile.status === 'VERIFIED' ? <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> : <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />}
                {profile.status}
              </Badge>
              {/* Historical Context Button (Optional) */}
              <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground opacity-50" title="Review Complete">
                <History className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}