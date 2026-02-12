'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, FileText, Loader2, CheckCircle2, ShieldAlert, History, Eye } from 'lucide-react';
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
    const toastId = toast.loading('Opening document...');
    try {
      const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, 'admin-org-context');
      window.open(viewUrl, '_blank');
      toast.dismiss(toastId);
    } catch (e) {
      toast.error('Could not open document', { id: toastId });
    }
  };

  const isHandled = isProcessed || profile.status !== 'PENDING';

  return (
    <tr className={cn(
      "transition-colors group",
      isHandled ? "bg-muted/10 opacity-70" : "hover:bg-muted/30"
    )}>
      <td className="px-6 py-5 align-top">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm text-foreground leading-tight">{profile.legalName}</span>
          <span className="text-[11px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded-3xl w-fit border border-border/40">
            {profile.registrationNumber || 'N/A'}
          </span>
        </div>
      </td>

      <td className="px-6 py-5 align-top">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-foreground">
            {profile.user?.firstName} {profile.user?.lastName}
          </span>
          <span className="text-[11px] text-muted-foreground">{profile.user?.email}</span>
        </div>
      </td>

      <td className="px-6 py-5 align-top">
        <div className="flex flex-wrap gap-2">
          {profile.documentKeys?.map((key: string, i: number) => (
            <button
              key={i}
              onClick={() => viewDoc(key)}
              className="h-8 px-3 rounded-3xl bg-background border border-border/60 hover:border-primary/30 text-muted-foreground hover:text-primary hover:bg-primary/5 flex items-center justify-center transition-all shadow-sm gap-1.5 group/doc"
              title="View Document"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold">Doc {i + 1}</span>
              <Eye className="h-3 w-3 opacity-0 group-hover/doc:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </td>

      <td className="px-6 py-5 align-top text-right">
        <div className="flex justify-end items-center gap-3">
          {!isHandled ? (
            <div className="flex gap-2 animate-in fade-in zoom-in duration-300">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-3xl" disabled={isLoading}>
                    <X className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[32px] p-8 border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Reject Verification</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-2">
                    <p className="text-xs text-muted-foreground">Provide a reason for rejection. This will be sent to the user.</p>
                    <Input
                      placeholder="Reason for rejection..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="rounded-3xl h-12"
                    />
                    <Button variant="destructive" className="w-full h-12 rounded-3xl font-bold text-xs shadow-sm" onClick={() => handleReview('REJECTED')} disabled={isLoading}>
                      {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Rejection'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button size="icon" variant="ghost" className="h-9 w-9 text-emerald-600 hover:bg-emerald-500/10 rounded-3xl" onClick={() => handleReview('VERIFIED')} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-500">
              <Badge className={cn(
                "h-7 px-3 rounded-3xl font-bold text-[11px] uppercase tracking-wider border",
                profile.status === 'VERIFIED' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
              )}>
                {profile.status === 'VERIFIED' ? <CheckCircle2 className="h-3 w-3 mr-1.5" /> : <ShieldAlert className="h-3 w-3 mr-1.5" />}
                {profile.status}
              </Badge>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}