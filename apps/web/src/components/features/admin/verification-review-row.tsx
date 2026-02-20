'use client';

import React, { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, FileText, Loader2, CheckCircle2, ShieldAlert, Eye } from 'lucide-react';
import { Button } from '../../ui/button';
import { ApiService } from '../../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';
import { motion } from 'framer-motion';

export const VerificationReviewRow = memo(function VerificationReviewRow({ profile }: { profile: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleReview = async (status: 'VERIFIED' | 'REJECTED') => {
    if (status === 'REJECTED' && !feedback.trim()) {
      return toast.error("Please Provide A Reason For This Decision.");
    }

    setIsLoading(true);
    const toastId = toast.loading("Updating Organization Status...");
    try {
      await ApiService.organizations.review(profile.id, { status, feedback });
      toast.success(`Organization ${status === 'VERIFIED' ? 'Verified' : 'Rejected'} Successfully`, { id: toastId });
      setIsProcessed(true);
      router.refresh();
    } catch (error) {
      toast.error("We Encountered A Problem Updating This Account", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const viewDoc = async (key: string) => {
    const toastId = toast.loading("Opening Document...");
    try {
      const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, 'admin-org-context');
      window.open(viewUrl, '_blank');
      toast.dismiss(toastId);
    } catch (e) {
      toast.error("Could Not Open This Document Safely", { id: toastId });
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
          <span className="text-[11px] text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-3xl w-fit border border-border/40">
            {profile.registrationNumber || 'Registration Not Available'}
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
              className="h-8 px-3 rounded-3xl bg-background border border-border/60 hover:border-primary/30 text-muted-foreground hover:text-primary hover:bg-primary/5 flex items-center justify-center transition-all shadow-sm gap-1.5 group/doc active:scale-95"
              title="View Document"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold">Document {i + 1}</span>
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
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-3xl border border-transparent hover:border-destructive/20" disabled={isLoading}>
                    <X className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl p-8 border-none shadow-2xl bg-card">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Decline Verification</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">Please provide a reason for declining this request. This helpful feedback will be sent directly to the organizer.</p>
                    <textarea
                      className="w-full h-32 rounded-3xl border border-border bg-muted/20 p-4 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                      placeholder="Share your feedback here..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                    <Button variant="destructive" className="w-full h-12 rounded-3xl font-bold text-xs tracking-widest shadow-md border-0 active:scale-95" onClick={() => handleReview('REJECTED')} disabled={isLoading || !feedback.trim()}>
                      {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Decision'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button size="icon" variant="ghost" className="h-9 w-9 text-emerald-600 hover:bg-emerald-500/10 rounded-3xl border border-transparent hover:border-emerald-500/20 active:scale-95" onClick={() => handleReview('VERIFIED')} disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-500">
              <Badge className={cn(
                "h-7 px-3 rounded-3xl font-bold text-[10px] tracking-wider border shadow-none",
                profile.status === 'VERIFIED' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
              )}>
                {profile.status === 'VERIFIED' ? <CheckCircle2 className="h-3 w-3 mr-1.5" /> : <ShieldAlert className="h-3 w-3 mr-1.5" />}
                {profile.status === 'VERIFIED' ? 'Verified' : 'Rejected'}
              </Badge>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});