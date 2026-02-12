'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Clock,
  Building2,
  FileText,
  UploadCloud,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Info
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { ApiService } from '../../../services/api';
import { OrganizationProfile } from '../../../types';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';
import { Badge } from '../../ui/badge';
import { motion } from 'framer-motion';

interface VerificationWizardProps {
  initialProfile: OrganizationProfile | null;
}

export function VerificationWizard({ initialProfile }: VerificationWizardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [legalName, setLegalName] = useState(initialProfile?.legalName || '');
  const [regNumber, setRegNumber] = useState(initialProfile?.registrationNumber || '');
  const [docKeys, setDocKeys] = useState<string[]>(initialProfile?.documentKeys || []);

  const status = initialProfile?.status || 'NOT_SUBMITTED';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return toast.error('File size exceeds 10mb limit');
    }

    setIsUploading(true);
    const toastId = toast.loading("Securing document...");
    try {
      const { uploadUrl, key } = await ApiService.proposals.getUploadUrl({
        fileType: file.type,
        useCase: 'kyc',
      });

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      setDocKeys(prev => [...prev, key]);
      toast.success('Document uploaded', { id: toastId });
    } catch (error) {
      toast.error('File upload failed', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveDoc = (keyToRemove: string) => {
    setDocKeys(prev => prev.filter(k => k !== keyToRemove));
  };

  const handleSubmit = async () => {
    if (!legalName.trim() || docKeys.length === 0) {
      return toast.error('Entity name and at least one document are required');
    }

    setIsLoading(true);
    const toastId = toast.loading("Updating identity...");
    try {
      await ApiService.organizations.submitKyc({
        legalName: legalName.trim(),
        registrationNumber: regNumber.trim(),
        documentKeys: docKeys,
      });

      toast.success('Identity updated', { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error('Update failed', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'VERIFIED') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <Card className="rounded-3xl border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-12 text-center space-y-6">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto border border-primary/20">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Organization verified</h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto font-medium">
                Your account is a recognized high-trust entity. Your causes carry the verified badge to build donor confidence.
              </p>
            </div>
            <div className="inline-flex flex-col items-center p-6 rounded-3xl bg-card border border-primary/10 shadow-sm min-w-[280px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Certified node identity</p>
              <p className="text-lg font-bold text-foreground tracking-tight">{initialProfile?.legalName}</p>
              {initialProfile?.registrationNumber && (
                <p className="text-xs text-primary font-mono mt-1.5 font-bold">
                  reg: {initialProfile.registrationNumber}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (status === 'PENDING') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <Card className="rounded-3xl border-amber-500/20 bg-amber-500/5 shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-12 text-center space-y-4">
            <div className="h-12 w-12 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
              <Clock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Audit in progress</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium">
                Our compliance nodes are currently reviewing your organizational documents. This typically resolves within 24-48 business hours.
              </p>
            </div>
            <div className="pt-2">
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-4 py-1.5 rounded-3xl font-bold text-[10px] uppercase tracking-wider">
                Under forensic review
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-4 md:space-y-6"
    >
      {status === 'REJECTED' && (
        <div className="p-4 rounded-3xl bg-destructive/5 border border-destructive/10 flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-destructive uppercase tracking-wider">Verification rejected</p>
            <p className="text-xs text-foreground/80 leading-relaxed font-medium italic">
              &quot;{initialProfile?.adminFeedback || "Your documents could not be verified. Please review the requirements and re-submit."}&quot;
            </p>
          </div>
        </div>
      )}

      <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
        <CardContent className="p-5 md:p-8 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="h-9 w-9 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-foreground">Entity Identification</h3>
                <p className="text-xs text-muted-foreground font-medium">Core registration data for your organization.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Legal organization name"
                placeholder="e.g. Global Relief Foundation"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                disabled={isLoading}
                className="h-10 rounded-3xl"
              />
              <Input
                label="Registration number (RC / TIN)"
                placeholder="e.g. RC-1234567"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                disabled={isLoading}
                className="h-10 rounded-3xl"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="h-9 w-9 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-foreground">Proof of Incorporation</h3>
                <p className="text-xs text-muted-foreground font-medium">Upload government-issued identity documents.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Upload official documents like Certificate of Incorporation. These are stored on encrypted forensic paths.
                </p>
                <label className={cn(
                  "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/60 rounded-3xl cursor-pointer bg-muted/10 hover:bg-muted/20 transition-all",
                  (isUploading || isLoading) && "opacity-50 cursor-not-allowed pointer-events-none"
                )}>
                  <div className="flex flex-col items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="animate-spin h-6 w-6 text-primary" />
                    ) : (
                      <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    )}
                    <p className="mt-2 text-xs font-bold text-muted-foreground">
                      {isUploading ? 'Securing...' : 'Upload proof'}
                    </p>
                  </div>
                  <input type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileUpload} disabled={isUploading || isLoading} />
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Asset ledger</p>
                {docKeys.length === 0 ? (
                  <div className="h-32 rounded-3xl border border-dashed border-border/60 flex flex-col items-center justify-center text-muted-foreground/30 bg-muted/5">
                    <Fingerprint className="h-6 w-6 mb-1.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">No documents</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar">
                    {docKeys.map((key, i) => (
                      <div key={key} className="flex items-center justify-between p-2.5 bg-muted/30 border border-border/40 rounded-3xl animate-in slide-in-from-right-1">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-3xl bg-background flex items-center justify-center text-primary shadow-sm border border-border/50 shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-foreground truncate block">Proof {i + 1}</span>
                            <span className="text-[10px] font-mono text-muted-foreground opacity-60">ref: {key.slice(-12)}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-3xl transition-all" onClick={() => handleRemoveDoc(key)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 rounded-3xl bg-muted/20 border border-dashed border-border/60 flex items-start gap-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
          By submitting, you affirm that the provided details are accurate. Misrepresentation of identity is a violation of the Givar protocol and will lead to permanent node exclusion.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !legalName.trim() || docKeys.length === 0}
          className="h-12 rounded-3xl px-8 font-bold text-sm tracking-widest shadow-sm active:scale-[0.98] transition-all gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Request verification
        </Button>
      </div>
    </motion.div>
  );
}