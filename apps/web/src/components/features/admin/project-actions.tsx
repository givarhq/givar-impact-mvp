'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Loader2, Trash2, PlayCircle, Megaphone, PauseCircle } from 'lucide-react';
import { ApiService } from '../../../services/api';
import { ConfirmModal } from '../../ui/confirm-modal';
import { Button } from '../../ui/button';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';

export function AdminProjectActions({
  id,
  status,
  broadcastedAt,
  mode = 'table'
}: {
  id: string;
  status: string;
  broadcastedAt?: string | null;
  mode?: 'table' | 'header';
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showResumeConfirm, setShowResumeConfirm] = useState(false);

  const executeAction = async (action: 'suspend' | 'delete' | 'reactivate' | 'broadcast' | 'pause' | 'resume') => {
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
      } else if (action === 'pause') {
        await ApiService.admin.pauseProject(id);
        toast.success('Donations paused for this cause');
        setShowPauseConfirm(false);
      } else if (action === 'resume') {
        await ApiService.admin.resumeProject(id);
        toast.success('Donations resumed for this cause');
        setShowResumeConfirm(false);
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

  if (mode === 'header') {
    if (status !== 'ACTIVE' && status !== 'PAUSED') return null;

    return (
      <>
        {status === 'ACTIVE' ? (
          <Button
            variant="outline"
            onClick={() => setShowPauseConfirm(true)}
            disabled={isLoading}
            className="rounded-3xl h-10 px-5 font-bold text-xs shadow-sm border-amber-500/30 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 transition-all active:scale-95 gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PauseCircle className="h-4 w-4" />}
            <span>Pause Donations</span>
          </Button>
        ) : (
          <Button
            onClick={() => setShowResumeConfirm(true)}
            disabled={isLoading}
            className="rounded-3xl h-10 px-5 font-bold text-xs shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white border-0 transition-all active:scale-95 gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            <span>Resume Donations</span>
          </Button>
        )}

        <ConfirmModal
          isOpen={showPauseConfirm}
          onClose={() => setShowPauseConfirm(false)}
          onConfirm={() => executeAction('pause')}
          isLoading={isLoading}
          variant="warning"
          title="Pause Donations"
          description="Temporarily pause incoming donations for this cause? It will remain visible on the public discovery feed with a paused notice and waitlist option."
          confirmText="Pause Donations"
        />

        <ConfirmModal
          isOpen={showResumeConfirm}
          onClose={() => setShowResumeConfirm(false)}
          onConfirm={() => executeAction('resume')}
          isLoading={isLoading}
          variant="default"
          title="Resume Donations"
          description="Reopen donations for this cause? Visitors on the waitlist will be automatically notified by email."
          confirmText="Resume Donations"
        />
      </>
    );
  }

  if (isLoading) return (
    <div className="flex justify-end pr-2">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {status === 'ACTIVE' && (
          <>
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

            <button
              onClick={() => setShowPauseConfirm(true)}
              title="Pause Donations"
              className="flex items-center justify-center text-amber-600 hover:bg-amber-500/10 h-8 w-8 rounded-3xl transition-colors"
            >
              <PauseCircle className="h-4 w-4" />
            </button>
          </>
        )}

        {status === 'PAUSED' && (
          <button
            onClick={() => setShowResumeConfirm(true)}
            title="Resume Donations"
            className="flex items-center justify-center text-emerald-600 hover:bg-emerald-500/10 h-8 w-8 rounded-3xl transition-colors"
          >
            <PlayCircle className="h-4 w-4" />
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
        isOpen={showPauseConfirm}
        onClose={() => setShowPauseConfirm(false)}
        onConfirm={() => executeAction('pause')}
        isLoading={isLoading}
        variant="warning"
        title="Pause Donations"
        description="Temporarily pause incoming donations for this cause? It will remain visible on the public discovery feed with a paused notice and waitlist option."
        confirmText="Pause Donations"
      />

      <ConfirmModal
        isOpen={showResumeConfirm}
        onClose={() => setShowResumeConfirm(false)}
        onConfirm={() => executeAction('resume')}
        isLoading={isLoading}
        variant="default"
        title="Resume Donations"
        description="Reopen donations for this cause? Visitors on the waitlist will be automatically notified by email."
        confirmText="Resume Donations"
      />

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