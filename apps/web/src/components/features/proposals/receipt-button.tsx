'use client';

import { useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';

interface ReceiptButtonProps {
    receiptKey: string;
    projectId: string;
    className?: string;
}

export function ReceiptButton({ receiptKey, projectId, className }: ReceiptButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleView = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isLoading) return;
        setIsLoading(true);

        const toastId = toast.loading('Decrypting secure receipt...');

        try {
            // 1. Request signed URL from backend
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(receiptKey, projectId);

            // 2. Open in new tab
            window.open(viewUrl, '_blank');
            toast.dismiss(toastId);
        } catch (error) {
            console.error('Receipt view error:', error);
            toast.error('Access Denied: Could not verify receipt access', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleView}
            disabled={isLoading}
            className={cn(
                "text-[9px] font-bold text-primary hover:text-primary/80 hover:underline flex items-center gap-1 uppercase tracking-wider transition-colors disabled:opacity-50",
                className
            )}
            title="View Payment Proof"
        >
            {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
                <ExternalLink className="h-3 w-3" />
            )}
            View Receipt
        </button>
    );
}