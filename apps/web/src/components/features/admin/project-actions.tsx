'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Loader2, Trash2 } from 'lucide-react';
import { ApiService } from '../../../services/api';
import { ConfirmModal } from '../../ui/confirm-modal';
import toast from 'react-hot-toast';

export function AdminProjectActions({ id, status }: { id: string, status: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAction = async (action: 'suspend' | 'delete') => {
    if (action === 'delete') {
      setShowDeleteConfirm(true);
      return;
    }

    executeAction('suspend');
  };

  const executeAction = async (action: 'suspend' | 'delete') => {
    setIsLoading(true);
    try {
      const actionMap = {
        suspend: () => ApiService.admin.suspendProject(id),
        delete: () => ApiService.admin.deleteProject(id),
      };

      await actionMap[action]();

      const pastTenseMap = {
        suspend: 'suspended',
        delete: 'deleted',
      };

      toast.success(`Project ${pastTenseMap[action]} successfully`);
      setShowDeleteConfirm(false);
      router.refresh();
    } catch (e: any) {
      const message = e.response?.data?.message || 'Action failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex justify-end pr-4">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {/* Suspension Action */}
        {status !== 'SUSPENDED' && (
          <button
            onClick={() => handleAction('suspend')}
            title="Suspend Project"
            className="flex items-center justify-center text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 h-8 w-8 rounded-xl transition-colors"
          >
            <Ban className="h-4 w-4" />
          </button>
        )}

        {/* Delete Action */}
        <button
          onClick={() => handleAction('delete')}
          title="Delete Project"
          className="flex items-center justify-center text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-8 w-8 rounded-xl transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => executeAction('delete')}
        isLoading={isLoading}
        variant="destructive"
        title="Delete Project"
        description="Are you sure you want to permanently delete this project? This procedure is irreversible and will remove the project from all discovery feeds. Only projects with zero donation history can be deleted."
        confirmText="Permanently Delete"
      />
    </>
  );
}