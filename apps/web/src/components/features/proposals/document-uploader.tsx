'use client';

import { useState } from 'react';
import { UploadCloud, Loader2, FileText, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiService } from '../../../services/api';
import { useProposalStore } from '../../../stores/proposal-store';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

export function DocumentUploader() {
  const { kycDocuments, addKycDocument, removeKycDocument } = useProposalStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size limit exceeded (max 10MB)');
      return;
    }

    setIsLoading(true);
    try {
      const { uploadUrl, key } = await ApiService.proposals.getUploadUrl({
        fileType: file.type,
        useCase: 'kyc',
      });

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      addKycDocument(key);
      toast.success('Document secured on ledger');
    } catch (error) {
      toast.error('Secure upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Upload Dropzone */}
      <div className="w-full min-w-0">
        <label
          htmlFor="doc-upload"
          className={cn(
            "flex flex-col items-center justify-center p-8 rounded-[32px] bg-muted/10 border-2 border-dashed border-border/60 hover:bg-muted/20 hover:border-primary/30 transition-all cursor-pointer group text-center shadow-sm",
            isLoading && "opacity-50 cursor-wait pointer-events-none"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
          ) : (
            <div className="h-14 w-14 rounded-3xl bg-background border border-border/40 flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          )}
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Click to upload documents</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-medium">PDF, DOCX, PNG up to 10MB</p>
          </div>
          <input
            id="doc-upload"
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,image/png,image/jpeg"
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </label>
      </div>

      {/* Asset List */}
      <div className="space-y-2 w-full min-w-0">
        <AnimatePresence mode="popLayout">
          {kycDocuments.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-1"
            >
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Identity asset vault</p>
            </motion.div>
          )}
          {kycDocuments.map((key, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={key}
              className="flex items-center justify-between p-3.5 bg-card border border-border/40 rounded-3xl shadow-sm group min-w-0"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10 shadow-inner">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-foreground truncate block">{key.split('/').pop()}</span>
                  <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold uppercase tracking-tight mt-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Encrypted path
                  </div>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 outline-none"
                onClick={() => {
                  removeKycDocument(key);
                  toast.success('Document detached');
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}