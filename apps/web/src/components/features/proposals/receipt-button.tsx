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

        const toastId = toast.loading('Opening Receipt...');

        try {
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(receiptKey, projectId);
            const isDoc = receiptKey.toLowerCase().includes('.pdf');
            setLightboxState({
                isOpen: true,
                items: [{ url: viewUrl, type: isDoc ? 'DOCUMENT' : 'IMAGE', alt: 'Transaction Receipt' }]
            });
            toast.dismiss(toastId);
        } catch (error) {
            toast.error('Access Denied', { id: toastId });
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