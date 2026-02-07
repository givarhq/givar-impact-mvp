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
  Info,
  Save
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { ApiService } from '../../../services/api';
import { OrganizationProfile } from '../../../types';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';
import { Badge } from '../../ui/badge';

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
      return toast.error('File size exceeds 10MB limit.');
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
      toast.success('Document uploaded successfully', { id: toastId });
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
      return toast.error('Entity name and at least one document are required.');
    }

    setIsLoading(true);
    const toastId = toast.loading("Updating ledger identity...");
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

  // --- STATE: VERIFIED ---
  if (status === 'VERIFIED') {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="rounded-[32px] border-primary/20 bg-primary/[0.02] shadow-sm overflow-hidden">
          <CardContent className="p-10 md:p-16 text-center space-y-8">
            <div className="h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto ring-8 ring-primary/5">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-foreground">Organization Verified</h2>
              <p className="text-muted-foreground leading-relaxed max-w-md mx-auto font-medium">
                Your account is a recognized high-trust entity. All your causes carry the verified badge to build donor confidence.
              </p>
            </div>
            <div className="inline-flex flex-col items-center p-8 rounded-[28px] bg-card border border-primary/20 shadow-sm min-w-[320px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Certified Node Identity</p>
              <p className="text-xl font-black text-foreground uppercase tracking-tight">{initialProfile?.legalName}</p>
              {initialProfile?.registrationNumber && (
                <p className="text-xs text-primary font-mono mt-2 font-bold bg-primary/5 px-3 py-1 rounded-lg">
                  REG: {initialProfile.registrationNumber}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- STATE: PENDING ---
  if (status === 'PENDING') {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="rounded-[32px] border-amber-500/20 bg-amber-500/[0.02] shadow-sm overflow-hidden">
          <CardContent className="p-10 md:p-16 text-center space-y-6">
            <div className="h-16 w-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Clock className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-foreground">Audit in Progress</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed font-medium">
                Our compliance nodes are currently reviewing your organizational documents. This typically resolves within 24-48 business hours.
              </p>
            </div>
            <div className="pt-4">
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em]">
                Status: Under Forensic Review
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- STATE: SUBMISSION FORM ---
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {status === 'REJECTED' && (
        <div className="p-6 rounded-[28px] bg-destructive/5 border border-destructive/20 flex items-start gap-4 shadow-sm">
          <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-black text-destructive uppercase tracking-widest">Verification Rejected</p>
            <p className="text-sm text-foreground/80 leading-relaxed font-medium italic">
              &quot;{initialProfile?.adminFeedback || "Your documents could not be verified. Please review the platform requirements and re-submit."}&quot;
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <Card className="rounded-[32px] border-border/50 bg-card shadow-sm overflow-hidden">
          <CardContent className="p-8 md:p-10 space-y-10">
            {/* 1. Identity Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-border/40 pb-6">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Entity Identification</h3>
                  <p className="text-xs text-muted-foreground font-medium">Core registration data for your organization.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Legal Organization Name"
                  placeholder="e.g. Global Relief Foundation"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  disabled={isLoading}
                  className="h-12"
                />
                <Input
                  label="Registration Number (RC / TIN)"
                  placeholder="e.g. RC-1234567"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  disabled={isLoading}
                  className="h-12"
                />
              </div>
            </div>

            {/* 2. Documentation Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b border-border/40 pb-6">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Proof of Incorporation</h3>
                  <p className="text-xs text-muted-foreground font-medium">Upload government-issued identity documents.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Upload official documents like Certificate of Incorporation or Form CO7. These are used strictly for compliance vetting and are stored on encrypted forensic paths.
                  </p>
                  <label className={cn(
                    "flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-border rounded-[24px] cursor-pointer bg-muted/20 hover:bg-muted/30 hover:border-primary/40 transition-all group",
                    (isUploading || isLoading) && "opacity-50 cursor-wait pointer-events-none"
                  )}>
                    <div className="flex flex-col items-center justify-center">
                      {isUploading ? (
                        <Loader2 className="animate-spin h-8 w-8 text-primary" />
                      ) : (
                        <UploadCloud className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                      <p className="mt-3 text-xs font-bold text-muted-foreground group-hover:text-foreground">
                        {isUploading ? 'Securing Document...' : 'Click to upload proof'}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-1">PDF, PNG, JPG (Max 10MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileUpload} disabled={isUploading || isLoading} />
                  </label>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Asset Ledger</p>
                  {docKeys.length === 0 ? (
                    <div className="h-44 rounded-[24px] border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground/30 bg-muted/5">
                      <Fingerprint className="h-8 w-8 mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">No documents attached</span>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-44 overflow-y-auto no-scrollbar">
                      {docKeys.map((key, i) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-muted/30 border border-border/40 rounded-2xl animate-in slide-in-from-right-2 duration-300">
                          <div className="flex items-center gap-4">
                            <div className="h-9 w-9 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm border border-border/50">
                              <FileText className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-foreground uppercase tracking-tight">Identity Proof {i + 1}</span>
                              <span className="text-[9px] font-mono text-muted-foreground opacity-60">REF: {key.slice(-12)}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all" onClick={() => handleRemoveDoc(key)}>
                            <Trash2 className="h-4 w-4" />
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
      </div>

      <div className="p-6 rounded-3xl bg-muted/20 border border-dashed border-border/60 flex items-start gap-4">
        <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
            By submitting for verification, you affirm that the provided entity details are accurate. Misrepresentation of identity is a violation of the Givar protocol and will lead to permanent node exclusion.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !legalName.trim() || docKeys.length === 0}
          className="h-16 rounded-[24px] px-10 font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 active:scale-95 transition-all gap-3"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
          Commit Verification
        </Button>
      </div>
    </div>
  );
}