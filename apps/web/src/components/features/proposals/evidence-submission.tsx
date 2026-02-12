'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Card, CardContent } from '../../ui/card';
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
    onSuccess?: () => void;
}

interface UploadedMedia {
    key: string;
    previewUrl: string;
}

export function EvidenceSubmission({ projectId, milestone, onSuccess }: EvidenceSubmissionProps) {
    const router = useRouter();
    const [description, setDescription] = useState('');
    const [media, setMedia] = useState<UploadedMedia[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUploadComplete = (data: { key: string; previewUrl: string }) => {
        if (media.length >= 6) {
            toast.error('Maximum 6 images allowed');
            return;
        }
        setMedia((prev) => [...prev, data]);
    };

    const removeMedia = (key: string) => {
        setMedia((prev) => prev.filter((m) => m.key !== key));
    };

    const handleSubmit = async () => {
        if (description.trim().length < 20) {
            toast.error('Detailed narrative required (min 20 chars)');
            return;
        }

        if (media.length === 0) {
            toast.error('Visual proof is required');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Syncing with ledger...');

        try {
            await ApiService.projects.submitProof(projectId, {
                milestoneId: milestone.id,
                description: description.trim(),
                imageKeys: media.map((m) => m.key),
            });

            toast.success('Evidence submitted', { id: toastId });
            setDescription('');
            setMedia([]);
            if (onSuccess) onSuccess();
            router.refresh();
        } catch (error: any) {
            toast.error('Submission failed', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full min-w-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-4 px-1">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20 shadow-inner">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground">Submit progress proof</h3>
                    <p className="text-xs text-muted-foreground font-medium truncate uppercase tracking-wider">
                        Phase: <span className="text-primary font-bold">{milestone.phase}</span>
                    </p>
                </div>
            </div>

            <div className="space-y-6 min-w-0">
                {/* Narrative Input Section */}
                <div className="space-y-2 min-w-0">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" /> Narrative update
                        </label>
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-3xl transition-colors",
                            description.length < 20 ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                        )}>
                            {description.length} chars
                        </span>
                    </div>
                    <textarea
                        className="w-full rounded-3xl border border-border/60 bg-muted/20 p-4 text-xs font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary/40 outline-none min-h-[110px] transition-all placeholder:text-muted-foreground/40 resize-none font-sans"
                        placeholder={`Describe work completed for "${milestone.phase}"...`}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                {/* Visual Media Section */}
                <div className="space-y-3 min-w-0">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 px-1">
                        <Camera className="h-3.5 w-3.5" /> Visual evidence
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 min-w-0">
                        {media.map((item) => (
                            <div key={item.key} className="relative aspect-square rounded-3xl overflow-hidden border border-border/40 group bg-muted shadow-sm">
                                <img
                                    src={item.previewUrl}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    alt="Proof"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8 rounded-2xl active:scale-95"
                                        onClick={() => removeMedia(item.key)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {media.length < 6 && (
                            <div className="h-full min-h-[100px]">
                                <ImageUploader
                                    label="Add photo"
                                    onUploadComplete={handleUploadComplete}
                                    useCase="public"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Accountability Notice */}
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl flex items-start gap-3 shadow-sm animate-in fade-in duration-500">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                        Submissions are immutable once verified by audit nodes and will be broadcasted to all project stakeholders.
                    </p>
                </div>

                {/* Action Footer */}
                <div className="pt-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || description.length < 20 || media.length === 0}
                        className="w-full h-12 rounded-3xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/10 transition-all active:scale-[0.98] gap-2 border-0"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Syncing with ledger
                            </>
                        ) : (
                            <>
                                <Send className="h-3.5 w-3.5" />
                                Post impact update
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}