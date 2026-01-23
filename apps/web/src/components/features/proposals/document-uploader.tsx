'use client';

import { useState } from 'react';
import { UploadCloud, Loader2, Paperclip, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiService } from '../../../services/api';
import { useProposalStore } from '../../../stores/proposal-store';
import { Button } from '../../ui/button';

export function DocumentUploader() {
  const { kycDocuments, addKycDocument, removeKycDocument } = useProposalStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Document size cannot exceed 10MB.');
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Get Presigned URL (using 'kyc' useCase for private pathing)
      const { uploadUrl, key } = await ApiService.proposals.getUploadUrl({
        fileType: file.type,
        useCase: 'kyc',
      });

      // 2. Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      // 3. Update state with the KEY, not the public URL
      addKycDocument(key);
      toast.success('Document uploaded successfully!');
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
        <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border text-center">
            <label htmlFor="doc-upload" className="cursor-pointer">
                {isLoading ? (
                    <Loader2 className="h-6 w-6 text-muted-foreground animate-spin mx-auto" />
                ) : (
                    <UploadCloud className="h-6 w-6 text-muted-foreground mx-auto" />
                )}
                <p className="mt-2 text-sm font-semibold text-foreground">Click to upload documents</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, PNG, JPG up to 10MB</p>
            </label>
            <input 
                id="doc-upload" 
                type="file" 
                className="hidden"
                accept=".pdf,.doc,.docx,image/png,image/jpeg"
                onChange={handleFileChange}
                disabled={isLoading}
            />
        </div>
        
        {kycDocuments.length > 0 && (
            <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Uploaded Files:</p>
                {kycDocuments.map(key => (
                    <div key={key} className="flex items-center justify-between p-2 pl-3 bg-card border rounded-lg">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-xs font-mono text-muted-foreground">{key.split('/').pop()}</span>
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeKycDocument(key)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
}