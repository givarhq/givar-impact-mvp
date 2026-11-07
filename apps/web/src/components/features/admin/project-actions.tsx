'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Loader2, Trash2, PlayCircle, Megaphone } from 'lucide-react';
import { ApiService } from '../../../services/api';
import { ConfirmModal } from '../../ui/confirm-modal';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';

export function AdminProjectActions({
  id,
  status,
  broadcastedAt
}: {
  id: string;
  status: string;
  broadcastedAt?: string | null;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);

  const executeAction = async (action: 'suspend' | 'delete' | 'reactivate' | 'broadcast') => {
    setIsLoading(true);
    try {
      if (action === 'suspend') {
        await ApiService.admin.suspendProject(id);
        toast.success('Project suspended');
        setShowSuspendConfirm(false);
      } else if (action === 'delete') {
        await ApiService.admin.deleteProject(id);
        toast.success('Project deleted');
        setShowDeleteConfirm(false);
      } else if (action === 'reactivate') {
        await ApiService.admin.approveProject(id);
        toast.success('Project reactivated');
        setShowReactivateConfirm(false);
      } else if (action === 'broadcast') {
        const res = await ApiService.admin.broadcastNewCause(id);
        if (res.broadcastCount > 0) {
          toast.success(`Notification sent to ${res.broadcastCount} subscribers`);
        } else {
          toast.success('No subscribers opted in to receive notifications');
        }
        setShowBroadcastConfirm(false);
      }

      router.refresh();
    } catch (e: any) {
      const message = e.response?.data?.message || 'Action failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex justify-end pr-2">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {status === 'ACTIVE' && (
          <button
            onClick={() => setShowBroadcastConfirm(true)}
            title={broadcastedAt ? "Re-notify Subscribers" : "Notify Subscribers"}
            className={cn(
              "flex items-center justify-center h-8 w-8 rounded-3xl transition-colors",
              broadcastedAt
                ? "text-muted-foreground hover:bg-muted"
                : "text-primary hover:bg-primary/10"
            )}
          >
            <Megaphone className="h-4 w-4" />
          </button>
        )}

        {status === 'SUSPENDED' && (
          <button
            onClick={() => setShowReactivateConfirm(true)}
            title="Reactivate Project"
            className="flex items-center justify-center text-emerald-600 hover:bg-emerald-500/10 h-8 w-8 rounded-3xl transition-colors"
          >
            <PlayCircle className="h-4 w-4" />
          </button>
        )}

        {status !== 'SUSPENDED' && (
          <button
            onClick={() => setShowSuspendConfirm(true)}
            title="Suspend Project"
            className="flex items-center justify-center text-amber-600 hover:bg-amber-500/10 h-8 w-8 rounded-3xl transition-colors"
          >
            <Ban className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={() => setShowDeleteConfirm(true)}
          title="Delete Project"
          className="flex items-center justify-center text-rose-600 hover:bg-rose-500/10 h-8 w-8 rounded-3xl transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <ConfirmModal
        isOpen={showBroadcastConfirm}
        onClose={() => setShowBroadcastConfirm(false)}
        onConfirm={() => executeAction('broadcast')}
        isLoading={isLoading}
        variant={broadcastedAt ? "warning" : "default"}
        title={broadcastedAt ? "Re-notify Subscribers" : "Notify Subscribers"}
        description={
          broadcastedAt
            ? `This cause was already broadcasted to subscribers on ${formatDate(broadcastedAt).split(',')[0]}. Are you sure you want to notify them again?`
            : "Send an email notification about this verified cause to all users who have opted in to receive updates."
        }
        confirmText={broadcastedAt ? "Re-notify Subscribers" : "Notify Subscribers"}
      />

      <ConfirmModal
        isOpen={showSuspendConfirm}
        onClose={() => setShowSuspendConfirm(false)}
        onConfirm={() => executeAction('suspend')}
        isLoading={isLoading}
        variant="warning"
        title="Suspend Project"
        description="Are you sure you want to suspend this project? It will be hidden from the discovery feed & will no longer be able to receive donations. You can reactivate it later."
        confirmText="Suspend Now"
      />

      <ConfirmModal
        isOpen={showReactivateConfirm}
        onClose={() => setShowReactivateConfirm(false)}
        onConfirm={() => executeAction('reactivate')}
        isLoading={isLoading}
        variant="default"
        title="Reactivate Project"
        description="This will restore the project to the active discovery feed & allow it to resume receiving donations."
        confirmText="Reactivate"
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => executeAction('delete')}
        isLoading={isLoading}
        variant="destructive"
        title="Delete Project"
        description="Irreversible Action: This will permanently remove the project from the system. This is only possible if the project has zero donation history."
        confirmText="Permanently Delete"
      />
    </>
  );
}