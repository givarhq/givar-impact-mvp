'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone } from 'lucide-react';
import { Button } from '../../ui/button';
import { ConfirmModal } from '../../ui/confirm-modal';
import { ApiService } from '../../../services/api';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';

interface BroadcastCauseTriggerProps {
    projectId: string;
    projectStatus: string;
    broadcastedAt?: string | null;
}

export function BroadcastCauseTrigger({
    projectId,
    projectStatus,
    broadcastedAt
}: BroadcastCauseTriggerProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (projectStatus !== 'ACTIVE') {
        return null;
    }

    const handleBroadcast = async () => {
        setIsLoading(true);
        try {
            const res = await ApiService.admin.broadcastNewCause(projectId);
            if (res.broadcastCount > 0) {
                toast.success(`Notification sent to ${res.broadcastCount} subscribers`);
            } else {
                toast.success('No subscribers opted in to receive notifications');
            }
            setIsOpen(false);
            router.refresh();
        } catch (e: any) {
            const message = e.response?.data?.message || 'Failed to broadcast cause';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button
                variant={broadcastedAt ? 'outline' : 'default'}
                onClick={() => setIsOpen(true)}
                className={cn(
                    'rounded-3xl h-10 px-5 font-bold text-xs shadow-sm transition-all active:scale-95 gap-2',
                    broadcastedAt
                        ? 'border-border/60 bg-background text-muted-foreground hover:bg-muted'
                        : 'bg-primary hover:bg-primary/90 text-white border-0'
                )}
            >
                <Megaphone className="h-4 w-4" />
                <span>{broadcastedAt ? 'Re-notify subscribers' : 'Notify subscribers'}</span>
            </Button>

            <ConfirmModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onConfirm={handleBroadcast}
                isLoading={isLoading}
                variant={broadcastedAt ? 'warning' : 'default'}
                title={broadcastedAt ? 'Re-notify Subscribers' : 'Notify Subscribers'}
                description={
                    broadcastedAt
                        ? `This cause was already broadcasted to subscribers on ${formatDate(broadcastedAt).split(',')[0]}. Are you sure you want to notify them again?`
                        : 'Send an email notification about this verified cause to all users who have opted in to receive updates.'
                }
                confirmText={broadcastedAt ? 'Re-notify Subscribers' : 'Notify Subscribers'}
            />
        </>
    );
}