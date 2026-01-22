'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Ban, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';

export function AdminProjectActions({ id, status }: { id: string, status: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: 'approve' | 'suspend') => {
  setIsLoading(true);
  try {
    // Map action to corresponding API method
    const actionMap = {
      approve: () => ApiService.admin.approveProject(id),
      suspend: () => ApiService.admin.suspendProject(id),
    };

    // Call the correct API method
    await actionMap[action]();

    // Map action to proper past tense for toast
    const pastTenseMap = {
      approve: 'approved',
      suspend: 'suspended',
    };

    toast.success(`Project ${pastTenseMap[action]} successfully`);
    router.refresh();
  } catch (e) {
    toast.error('Action failed');
  } finally {
    setIsLoading(false);
  }
};

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;

  return (
    <div className="flex items-center justify-end gap-2">
      {status !== 'ACTIVE' && (
        <Button size="icon" variant="ghost" onClick={() => handleAction('approve')} title="Approve" className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 h-8 w-8">
          <Check className="h-4 w-4" />
        </Button>
      )}
      {status !== 'SUSPENDED' && (
        <Button size="icon" variant="ghost" onClick={() => handleAction('suspend')} title="Suspend" className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8">
          <Ban className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}