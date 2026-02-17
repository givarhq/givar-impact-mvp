'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Target } from 'lucide-react';
import { Modal } from '../../ui/modal';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { cn } from '../../../lib/utils/cn';
import { ApiService } from '../../../services/api';
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
      toast.error('Please enter a valid target amount');
      return;
    }
    setIsLoading(true);

    try {
      await ApiService.goals.upsert({
        targetAmount: (Number(targetAmount) * 100).toString(),
        currency: 'NGN',
        interval,
      });

      toast.success(goal ? 'Goal updated' : 'Goal set');
      onClose();
      router.refresh();
    } catch (error) {
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goal ? 'Update your goal' : 'Set a giving goal'}
      description="Commit to making a consistent impact. You can change this anytime."
    >
      <div className="space-y-5 pt-1">
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground  tracking-wider ml-1">Frequency</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setInterval('MONTHLY')}
              className={cn("h-11 rounded-3xl border text-xs font-bold transition-all",
                interval === 'MONTHLY' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/40 hover:border-border/80'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('YEARLY')}
              className={cn("h-11 rounded-3xl border text-xs font-bold transition-all",
                interval === 'YEARLY' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/30 border-border/40 hover:border-border/80'
              )}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground  tracking-wider ml-1">Target amount (ngn)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₦</span>
            <Input
              type="text"
              placeholder="50,000"
              className="pl-8 h-12 text-lg font-bold rounded-3xl bg-muted/20 border-border/40 focus:bg-background focus:border-primary/50"
              value={formatNumberInput(targetAmount)}
              onChange={handleAmountChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-3xl h-11 px-6 font-bold text-xs text-muted-foreground">
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading} className="min-w-[140px] rounded-3xl h-11 px-8 font-bold text-xs shadow-sm">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (goal ? 'Update goal' : 'Set goal')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}