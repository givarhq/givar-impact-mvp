'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../ui/modal';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Project } from '../../../types';
import { apiClient } from '../../../lib/api-client';
import { formatCurrency } from '../../../lib/utils/format';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export function DonationModal({ isOpen, onClose, project }: DonationModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!project) return null;

  const handleDonate = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      // Backend expects "1000" (BigInt string representing minor units)
      // Standard: Input is Major (100). We convert to Minor (10000)
      const minorAmount = (Number(amount) * 100).toString();

      await apiClient.post('/donations', {
        projectId: project.id,
        amount: minorAmount,
        currency: project.currency,
        message: 'Impact donation via Web'
      });

      toast.success(`Successfully donated to ${project.title}!`);
      onClose();
      setAmount('');
      router.refresh();
    } catch (error: any) {
       if (error?.response?.data?.message?.includes('Insufficient')) {
          toast.error('Insufficient wallet balance.');
       }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Support ${project.title}`}
      description="Your contribution goes directly to this cause."
    >
      <div className="space-y-6 pt-2">
        <div className="bg-secondary/50 p-4 rounded-lg space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Progress</p>
            <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-primary">
                    {formatCurrency(project.raisedAmount, project.currency)}
                </span>
                <span className="text-sm text-muted-foreground">
                    raised of {formatCurrency(project.targetAmount, project.currency)} goal
                </span>
            </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium leading-none">
            Donation Amount ({project.currency})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₦</span>
            <Input
              type="number"
              placeholder="1000"
              className="pl-8 text-lg font-medium"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2 text-xs">
            {['500', '1000', '5000', '10000'].map((val) => (
                <button 
                    key={val}
                    onClick={() => setAmount(val)}
                    className="bg-card border border-border px-3 py-1.5 rounded-md hover:border-primary hover:text-primary transition-colors"
                >
                    ₦{val}
                </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleDonate} disabled={isLoading} className="min-w-[100px]">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}