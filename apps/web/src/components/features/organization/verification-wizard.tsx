'use client';

import React, { useState, memo } from 'react';
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
  UserCheck,
  Camera
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { ApiService } from '../../../services/api';
import { OrganizationProfile } from '../../../types';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';
import { Badge } from '../../ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface VerificationWizardProps {
  user: any;
  initialProfile: OrganizationProfile | null;
}

export const VerificationWizard = memo(function VerificationWizard({ user, initialProfile }: VerificationWizardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<'primary' | 'secondary' | null>(null);

  // LOGIC: Strictly bind the verification path to their account type setting.
  // If they previously submitted as one type, we respect that historic submission.
  const kycType = (initialProfile as any)?.kycType || (user.accountType === 'ORGANIZER' ? 'ORGANIZATION' : 'INDIVIDUAL');

  const [legalName, setLegalName] = useState(initialProfile?.legalName || '');
  const [regNumber, setRegNumber] = useState(initialProfile?.registrationNumber || '');

  const [primaryDoc, setPrimaryDoc] = useState<{ key: string, name: string } | null>(
    initialProfile?.documentKeys?.[0] ? { key: initialProfile.documentKeys[0], name: 'Uploaded document 1' } : null
  );
  const [secondaryDoc, setSecondaryDoc] = useState<{ key: string, name: string } | null>(
    initialProfile?.documentKeys?.[1] ? { key: initialProfile.documentKeys[1], name: 'Uploaded document 2' } : null
  );

  const status = initialProfile?.status || 'NOT_SUBMITTED';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, slot: 'primary' | 'secondary') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return toast.error('File size exceeds 10mb limit');
    }

    setUploadingSlot(slot);
    const toastId = toast.loading("Encrypting and saving document...");

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

      if (slot === 'primary') {
        setPrimaryDoc({ key, name: file.name });
      } else {
        setSecondaryDoc({ key, name: file.name });
      }

      toast.success('File uploaded securely', { id: toastId });
    } catch (error) {
      toast.error('File upload failed', { id: toastId });
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!legalName.trim() || !primaryDoc || !secondaryDoc) {
      return toast.error('Please provide your legal name and both required documents.');
    }

    setIsLoading(true);
    const toastId = toast.loading("Submitting...");
    try {
      await ApiService.organizations.submitKyc({
        legalName: legalName.trim(),
        registrationNumber: regNumber.trim(),
        documentKeys: [primaryDoc.key, secondaryDoc.key],
        kycType: kycType,
      });

      toast.success('Identity submitted for review', { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error('Submission failed. Please try again.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'VERIFIED') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-5xl mx-auto"
      >
        <Card className="rounded-3xl border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-12 text-center space-y-6">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto border border-primary/20">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {kycType === 'INDIVIDUAL' ? 'Identity verified' : 'Organization verified'}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto font-medium">
                Your account is a recognized and trusted partner. You can now launch public causes on the platform seamlessly.
              </p>
            </div>
            <div className="inline-flex flex-col items-center p-6 rounded-3xl bg-card border border-primary/10 shadow-sm min-w-[280px]">
              <div className="flex items-center gap-2 mb-3">
                {kycType === 'INDIVIDUAL' ? <UserCheck className="h-3.5 w-3.5 text-muted-foreground" /> : <Building2 className="h-3.5 w-3.5 text-muted-foreground" />}
                <p className="text-[11px] font-bold tracking-widest text-muted-foreground">
                  Verified {kycType === 'INDIVIDUAL' ? 'individual identity' : 'organization identity'}
                </p>
              </div>
              <p className="text-lg font-bold text-foreground tracking-tight">{initialProfile?.legalName}</p>
              {initialProfile?.registrationNumber && (
                <p className="text-xs text-primary font-mono mt-1.5 font-bold">
                  {kycType === 'INDIVIDUAL' ? 'id:' : 'reg:'} {initialProfile.registrationNumber}
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-5xl mx-auto"
      >
        <Card className="rounded-3xl border-amber-500/20 bg-amber-500/5 shadow-sm overflow-hidden">
          <CardContent className="p-6 md:p-12 text-center space-y-4">
            <div className="h-12 w-12 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
              <Clock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Review in progress</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium">
                Our compliance team is currently auditing your documents. This process ensures the integrity of our platform and usually takes 24 to 48 hours.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto space-y-4 md:space-y-6"
    >
      <div className="p-5 rounded-3xl bg-blue-50 border border-blue-100 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-2">
        <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-blue-900 text-sm">One-time identity verification</h4>
          <p className="text-xs text-blue-800 leading-relaxed font-medium">
            This is a strict, one-time verification process. Once your identity is approved by our audit team, you will be able to launch as many causes as you want without needing to re-verify who you are.
          </p>
        </div>
      </div>

      {status === 'REJECTED' && (
        <div className="p-5 rounded-3xl bg-destructive/5 border border-destructive/10 flex items-start gap-4 shadow-sm">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-destructive">Verification declined</p>
            <p className="text-xs text-foreground/80 leading-relaxed font-medium italic">
              &quot;{initialProfile?.adminFeedback || "Your documents could not be confirmed. Please check the requirements and try again."}&quot;
            </p>
          </div>
        </div>
      )}

      <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
        <CardContent className="p-5 md:p-8 space-y-8">

          {/* Fixed Identity Type Display */}
          <div className="space-y-4 border-b border-border/40 pb-6">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-foreground">Account classification</h3>
              <p className="text-xs text-muted-foreground font-medium">
                You are verifying as {kycType === 'INDIVIDUAL' ? (
                  <strong>an individual advocate</strong>
                ) : (
                  <strong>a registered corporation</strong>
                )}
                . If this is incorrect, you can change your account mode in the <Link href="/dashboard/settings?tab=profile" className="text-primary hover:underline font-bold">Profile</Link> tab.
              </p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="h-9 w-9 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground">
                {kycType === 'INDIVIDUAL' ? <Fingerprint className="h-4.5 w-4.5" /> : <Building2 className="h-4.5 w-4.5" />}
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-foreground">
                  {kycType === 'INDIVIDUAL' ? 'Identity information' : 'Organization information'}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  {kycType === 'INDIVIDUAL' ? 'Basic details exactly matching your official government ID.' : 'Basic details matching your corporate registration.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label={kycType === 'INDIVIDUAL' ? "Full legal name" : "Legal organization name"}
                placeholder={kycType === 'INDIVIDUAL' ? "e.g. Jane Doe" : "e.g. Global Relief Foundation"}
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                disabled={isLoading}
                className="h-12 rounded-3xl bg-muted/20"
              />
              <Input
                label={kycType === 'INDIVIDUAL' ? "Government ID number" : "Registration number (RC / TIN)"}
                placeholder={kycType === 'INDIVIDUAL' ? "e.g. NIN, SSN, or Passport No." : "e.g. RC-1234567"}
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                disabled={isLoading}
                className="h-12 rounded-3xl bg-muted/20"
              />
            </div>
          </div>

          {/* Document Uploads */}
          <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slot 1 */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">
                    {kycType === 'INDIVIDUAL' ? 'Government ID' : 'Certificate of incorporation'}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    {kycType === 'INDIVIDUAL' ? 'A clear photo or scan of your official ID.' : 'Your official CAC or equivalent registration document.'}
                  </p>
                </div>

                {primaryDoc ? (
                  <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-3xl group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-2xl bg-background flex items-center justify-center text-primary shadow-sm border border-border/50 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground truncate block">{primaryDoc.name}</span>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="h-3 w-3" /> Securely attached
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all" onClick={() => setPrimaryDoc(null)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className={cn(
                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/60 rounded-3xl cursor-pointer bg-muted/5 hover:bg-muted/20 transition-all",
                    uploadingSlot === 'primary' && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}>
                    <div className="flex flex-col items-center justify-center">
                      {uploadingSlot === 'primary' ? (
                        <Loader2 className="animate-spin h-6 w-6 text-primary mb-2" />
                      ) : (
                        <UploadCloud className="h-6 w-6 text-muted-foreground mb-2" />
                      )}
                      <p className="text-xs font-bold text-muted-foreground">
                        {uploadingSlot === 'primary' ? 'Encrypting file...' : 'Upload document'}
                      </p>
                    </div>
                    <input type="file" className="hidden" accept="application/pdf,image/*" onChange={(e) => handleFileUpload(e, 'primary')} disabled={!!uploadingSlot} />
                  </label>
                )}
              </div>

              {/* Slot 2 */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">
                    {kycType === 'INDIVIDUAL' ? 'Liveness check (selfie)' : "Director's government ID"}
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">
                    {kycType === 'INDIVIDUAL' ? 'Take a clear photo of your face holding your ID next to it.' : 'The official ID of the primary director or trustee.'}
                  </p>
                </div>

                {secondaryDoc ? (
                  <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-3xl group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-2xl bg-background flex items-center justify-center text-primary shadow-sm border border-border/50 shrink-0">
                        {kycType === 'INDIVIDUAL' ? <Camera className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground truncate block">{secondaryDoc.name}</span>
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="h-3 w-3" /> Securely attached
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all" onClick={() => setSecondaryDoc(null)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className={cn(
                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/60 rounded-3xl cursor-pointer bg-muted/5 hover:bg-muted/20 transition-all",
                    uploadingSlot === 'secondary' && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}>
                    <div className="flex flex-col items-center justify-center">
                      {uploadingSlot === 'secondary' ? (
                        <Loader2 className="animate-spin h-6 w-6 text-primary mb-2" />
                      ) : (
                        kycType === 'INDIVIDUAL' ? <Camera className="h-6 w-6 text-muted-foreground mb-2" /> : <UploadCloud className="h-6 w-6 text-muted-foreground mb-2" />
                      )}
                      <p className="text-xs font-bold text-muted-foreground">
                        {uploadingSlot === 'secondary' ? 'Encrypting file...' : 'Upload document'}
                      </p>
                    </div>
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'secondary')} disabled={!!uploadingSlot} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-5 rounded-3xl bg-muted/20 border border-dashed border-border/60 flex items-start gap-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
          By submitting, you confirm that these details are correct and belong to you. Providing false information goes against Givar guidelines and will result in permanent account termination.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !legalName.trim() || !primaryDoc || !secondaryDoc}
          className="h-12 rounded-3xl px-10 font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all gap-2 border-0"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Submit
        </Button>
      </div>
    </motion.div>
  );
});