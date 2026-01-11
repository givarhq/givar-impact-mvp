'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../ui/modal';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { cn } from '../../../lib/utils/cn';
import { apiClient } from '../../../lib/api-client';
import { GivingGoal } from '../../../types';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';

interface GoalSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: GivingGoal | null;
}

export function GoalSetupModal({ isOpen, onClose, goal }: GoalSetupModalProps) {
  const router = useRouter();
  const [targetAmount, setTargetAmount] = useState('');
  const [interval, setInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [isLoading, setIsLoading] = useState(false);
  
  // SOTA: Pre-fill form if editing an existing goal
  useEffect(() => {
    if (goal && isOpen) {
      setTargetAmount((Number(goal.targetAmount) / 100).toString());
      setInterval(goal.interval);
    } else {
      setTargetAmount('');
      setInterval('MONTHLY');
    }
  }, [goal, isOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberInput(e.target.value);
    setTargetAmount(parseFormattedNumber(formatted));
  };
  
  const handleSubmit = async () => {
    if (!targetAmount || isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      toast.error('Please enter a valid target amount.');
      return;
    }
    setIsLoading(true);

    try {
      await apiClient.post('/goals', {
        targetAmount: (Number(targetAmount) * 100).toString(),
        currency: 'NGN', // Assuming NGN for now
        interval,
      });

      toast.success(goal ? 'Goal updated successfully!' : 'Goal set successfully!');
      onClose();
      router.refresh(); // SOTA: Refresh server components
    } catch (error) {
      // Interceptor handles generic errors
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goal ? 'Update Your Goal' : 'Set a Giving Goal'}
      description="Commit to making a consistent impact. You can change this anytime."
    >
      <div className="space-y-6 pt-2">
        <div className="space-y-3">
          <label className="text-sm font-medium">Frequency</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setInterval('MONTHLY')}
              className={cn("p-3 rounded-xl border text-sm",
                interval === 'MONTHLY' ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-muted/50 hover:border-border'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('YEARLY')}
              className={cn("p-3 rounded-xl border text-sm",
                interval === 'YEARLY' ? 'bg-primary/10 border-primary text-primary font-semibold' : 'bg-muted/50 hover:border-border'
              )}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Target Amount (NGN)</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₦</span>
            <Input
              type="text"
              placeholder="50,000"
              className="pl-8 text-lg font-medium"
              value={formatNumberInput(targetAmount)}
              onChange={handleAmountChange}
              autoFocus
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading} className="min-w-[120px]">
            {goal ? 'Update Goal' : 'Set Goal'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}