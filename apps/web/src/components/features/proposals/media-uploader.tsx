'use client';

import { useState } from 'react';
import { UploadCloud, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  useCase: 'public' | 'kyc';
  label: string;
}

export function ImageUploader({ onUploadComplete, useCase, label }: ImageUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size cannot exceed 5MB.');
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Get Presigned URL from our backend
      const { uploadUrl, publicUrl } = await ApiService.proposals.getUploadUrl({
        fileType: file.type,
        useCase,
      });

      // 2. Upload directly to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // 3. Notify parent component of success
      onUploadComplete(publicUrl!);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
        <label htmlFor="file-upload" className={cn(
            "flex flex-col items-center justify-center w-full h-48 border-2 border-border border-dashed rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors",
            isLoading && "cursor-wait"
        )}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isLoading ? (
                    <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                ) : (
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-semibold">{label}</span>
                </p>
                <p className="text-xs text-muted-foreground/80">PNG, JPG, GIF up to 5MB</p>
            </div>
            <input 
                id="file-upload" 
                type="file" 
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileChange}
                disabled={isLoading}
            />
        </label>
    </div>
  );
}