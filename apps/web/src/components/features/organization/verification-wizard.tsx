'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, ShieldAlert, Clock, Building2, 
  FileText, UploadCloud, Loader2, Trash2, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { ApiService } from '../../../services/api';
import { OrganizationProfile } from '../../../types';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';

export function VerificationWizard({ initialProfile }: { initialProfile: OrganizationProfile | null }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [legalName, setLegalName] = useState(initialProfile?.legalName || '');
  const [regNumber, setRegNumber] = useState(initialProfile?.registrationNumber || '');
  const [docKeys, setDocKeys] = useState<string[]>(initialProfile?.documentKeys || []);

  const status = initialProfile?.status || 'NOT_SUBMITTED';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('Max file size is 10MB');

    setIsUploading(true);
    try {
      const { uploadUrl, key } = await ApiService.proposals.getUploadUrl({
        fileType: file.type,
        useCase: 'kyc',
      });
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setDocKeys(prev => [...prev, key]);
      toast.success('Document uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!legalName || docKeys.length === 0) return toast.error('Please complete all required fields.');
    setIsLoading(true);
    try {
      await ApiService.organizations.submitKyc({
        legalName,
        registrationNumber: regNumber,
        documentKeys: docKeys,
      });
      toast.success('Verification submitted!');
      router.refresh();
    } catch (error) {
      toast.error('Submission failed');
    } finally {
      setIsLoading(false);
    }
  };

  // --- STATE 1: VERIFIED ---
  if (status === 'VERIFIED') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="h-24 w-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto ring-8 ring-primary/5">
          <ShieldCheck className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight">Organization Verified</h2>
          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            Your account is now a high-trust entity. All your projects will carry the <span className="text-primary font-bold">Verified Giver</span> badge.
          </p>
        </div>
        <Card className="bg-card/50 border-primary/20 p-6 rounded-3xl max-w-sm mx-auto">
           <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Linked Entity</p>
           <p className="text-lg font-bold text-foreground">{initialProfile?.legalName}</p>
           <p className="text-xs text-muted-foreground font-mono mt-1">{initialProfile?.registrationNumber}</p>
        </Card>
      </div>
    );
  }

  // --- STATE 2: PENDING ---
  if (status === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <div className="h-20 w-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Clock className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Review in Progress</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Our compliance team is verifying your documents. This usually takes 24-48 hours. We'll notify you once a decision is made.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl px-8" onClick={() => router.push('/dashboard')}>
            Return to Dashboard
        </Button>
      </div>
    );
  }

  // --- STATE 3: SUBMISSION / REJECTED ---
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Organization Trust</h1>
        <p className="text-muted-foreground">Complete your profile to unlock higher credibility and donor confidence.</p>
      </div>

      {status === 'REJECTED' && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                  <p className="text-sm font-bold text-destructive uppercase tracking-wide">Verification Rejected</p>
                  <p className="text-sm text-destructive/80 leading-relaxed">
                      {initialProfile?.adminFeedback || "Your documents could not be verified. Please review the requirements and re-submit."}
                  </p>
              </div>
          </div>
      )}

      <div className="space-y-6">
          <Card className="rounded-3xl p-8 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
            <div className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Entity Details
                    </h3>
                    <Input 
                        label="Legal Organization Name" 
                        placeholder="e.g. Save the Children Ltd" 
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        disabled={isLoading}
                    />
                    <Input 
                        label="Registration Number (RC / TIN)" 
                        placeholder="e.g. RC-1234567" 
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <div className="space-y-4 pt-6 border-t border-border/50">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Legal Documents
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Upload Certificate of Incorporation, Form CO7, or any valid government-issued organizational identity document.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {docKeys.map((key, i) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-muted/30 border border-border/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center border border-border/50">
                                        <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-xs font-mono opacity-60">doc_{i+1}_{key.slice(-8)}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDocKeys(docKeys.filter(k => k !== key))}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        <label className={cn(
                            "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-muted/30 transition-all",
                            isUploading && "opacity-50 cursor-wait"
                        )}>
                            {isUploading ? <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /> : <UploadCloud className="h-6 w-6 text-muted-foreground" />}
                            <span className="mt-2 text-xs font-medium text-muted-foreground">Click to upload doc</span>
                            <input type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileUpload} disabled={isUploading || isLoading} />
                        </label>
                    </div>
                </div>

                <div className="pt-6">
                    <Button onClick={handleSubmit} disabled={isLoading || !legalName || docKeys.length === 0} className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20">
                        {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                        Submit for Verification
                    </Button>
                </div>
            </div>
          </Card>
      </div>
    </div>
  );
}