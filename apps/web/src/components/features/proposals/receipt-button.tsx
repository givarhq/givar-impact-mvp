'use client';

import { useState, memo } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import { Button } from '../../ui/button';
import { ImageLightbox, LightboxItem } from '../../ui/image-lightbox';

interface ReceiptButtonProps {
    receiptKey: string;
    projectId: string;
    className?: string;
}

export const ReceiptButton = memo(function ReceiptButton({ receiptKey, projectId, className }: ReceiptButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; items: LightboxItem[] }>({ isOpen: false, items: [] });

    const handleView = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;
        setIsLoading(true);

        const toastId = toast.loading('Opening receipt...');

        try {
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(receiptKey, projectId);
            toast.dismiss(toastId);
            const isDoc = receiptKey.toLowerCase().includes('.pdf') || receiptKey.toLowerCase().includes('.doc');
            if (isDoc) {
                window.open(viewUrl, '_blank');
            } else {
                setLightboxState({
                    isOpen: true,
                    items: [{ url: viewUrl, type: 'IMAGE', alt: 'Transaction Receipt' }]
                });
            }
        } catch (error) {
            toast.error('Access denied', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={handleView}
                disabled={isLoading}
                className={cn(
                    "h-7 rounded-3xl px-3 border-border/60 font-bold text-xs tracking-wider gap-1.5 bg-background hover:bg-muted transition-all active:scale-95",
                    className
                )}
            >
                {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    <ExternalLink className="h-3 w-3" />
                )}
                View Receipt
            </Button>

            <ImageLightbox
                isOpen={lightboxState.isOpen}
                onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
                items={lightboxState.items}
            />
        </>
    );
});