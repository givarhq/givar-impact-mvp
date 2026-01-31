'use client';

import React, { useState } from 'react';
import {
    Camera,
    Send,
    Loader2,
    Trash2,
    FileText,
    ShieldCheck,
    AlertTriangle
} from 'lucide-react';
import { Button } from '../../ui/button';
import { ImageUploader } from './media-uploader';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';

interface EvidenceSubmissionProps {
    projectId: string;
    milestone: {
        id: string;
        phase: string;
    };
    onSuccess: () => void;
}

interface UploadedMedia {
    key: string;
    previewUrl: string;
}

export function EvidenceSubmission({ projectId, milestone, onSuccess }: EvidenceSubmissionProps) {
    const [description, setDescription] = useState('');
    const [media, setMedia] = useState<UploadedMedia[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle multiple image uploads with preview state
    const handleUploadComplete = (data: { key: string; previewUrl: string }) => {
        if (media.length >= 6) {
            toast.error('Maximum 6 images allowed per milestone proof.');
            return;
        }
        setMedia((prev) => [...prev, data]);
    };

    const removeMedia = (key: string) => {
        setMedia((prev) => prev.filter((m) => m.key !== key));
    };

    const handleSubmit = async () => {
        // Pre-submission validation
        if (description.trim().length < 20) {
            toast.error('Please provide a more detailed narrative (minimum 20 characters).');
            return;
        }

        if (media.length === 0) {
            toast.error('Please upload at least one image as visual proof.');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Syncing proof with the ledger...');

        try {
            await ApiService.projects.submitProof(projectId, {
                milestoneId: milestone.id,
                description: description.trim(),
                imageKeys: media.map((m) => m.key),
            });

            toast.success('Impact evidence submitted for verification!', { id: toastId });
            onSuccess();

            // Reset form
            setDescription('');
            setMedia([]);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to submit evidence.';
            toast.error(message, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-card border border-border/50 rounded-[32px] p-6 md:p-8 shadow-xl shadow-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-foreground">Submit Proof of Progress</h3>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Phase: <span className="text-primary">{milestone.phase}</span>
                    </p>
                </div>
            </div>

            <div className="space-y-8">
                {/* 1. Narrative Input */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" /> Narrative Update
                        </label>
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md",
                            description.length < 20 ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                        )}>
                            {description.length} chars
                        </span>
                    </div>
                    <textarea
                        className="w-full rounded-2xl border border-border bg-muted/20 p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[140px] transition-all placeholder:text-muted-foreground/50 resize-none"
                        placeholder={`Describe the specific work completed for "${milestone.phase}"...`}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                {/* 2. Visual Proof Grid */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Camera className="h-4 w-4 text-primary" /> Visual Evidence
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {media.map((item) => (
                            <div key={item.key} className="relative aspect-square rounded-2xl overflow-hidden border border-border group shadow-sm bg-muted">
                                <img
                                    src={item.previewUrl}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    alt="Proof preview"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8 rounded-xl"
                                        onClick={() => removeMedia(item.key)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Uploader Slot */}
                        {media.length < 6 && (
                            <div className="h-full min-h-[120px]">
                                <ImageUploader
                                    label="Add Proof"
                                    onUploadComplete={handleUploadComplete}
                                    useCase="public"
                                />
                            </div>
                        )}
                    </div>
                    <p className="text-[10px] text-muted-foreground px-1 italic">
                        Upload high-quality photos of the site, materials, or completed work.
                    </p>
                </div>

                {/* 3. Global Guard Notice */}
                <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                        <strong>Review Notice:</strong> Submissions are immutable once verified by the Givar audit team. Ensure all details are accurate as this will be visible to all project donors.
                    </p>
                </div>

                {/* 4. Action Button */}
                <div className="pt-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || description.length < 20 || media.length === 0}
                        className="w-full h-16 rounded-[24px] font-bold text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Submitting to Ledger...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Send className="h-5 w-5" />
                                <span>Post Impact Update</span>
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}