'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Repeat, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../ui/modal';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { DonationModalProps } from '../../../types';
import { apiClient } from '../../../lib/api-client';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format'; // SOTA: Import new helpers
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { cn } from '../../../lib/utils/cn';

export function DonationModal({ isOpen, onClose, project }: DonationModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [donationType, setDonationType] = useState<'one-time' | 'recurring'>('one-time');
  const [interval, setInterval] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');

  if (!project) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatNumberInput(e.target.value);
    setAmount(parseFormattedNumber(formattedValue));
  };
  
  const setQuickAmount = (val: string) => {
    setAmount(val);
  }

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setIsLoading(true);

    try {
      const minorAmount = (Number(amount) * 100).toString();
      
      if (donationType === 'one-time') {
        await apiClient.post('/donations', {
          projectId: project.id,
          amount: minorAmount,
          currency: project.currency,
        });
        toast.success(`Successfully donated to ${project.title}!`);
      } else {
        await apiClient.post('/donations/subscribe', {
          projectId: project.id,
          amount: minorAmount,
          currency: project.currency,
          interval: interval,
        });
        toast.success(`Your recurring donation to ${project.title} is active!`);
      }

      onCloseAndReset();
      router.refresh();
    } catch (error: any) {
       if (error?.response?.data?.message?.includes('Insufficient')) {
          toast.error('Insufficient funds for the first donation.');
       }
    } finally {
      setIsLoading(false);
    }
  };
  
  const onCloseAndReset = () => {
    onClose();
    setTimeout(() => {
        setAmount('');
        setDonationType('one-time');
        setInterval('MONTHLY');
    }, 200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCloseAndReset}
      title={`Support ${project.title}`}
      description="Your contribution goes directly to this cause."
    >
        <Tabs value={donationType} onValueChange={(v) => setDonationType(v as any)} className="w-full">
            <TabsList>
                <TabsTrigger value="one-time">One-Time</TabsTrigger>
                <TabsTrigger value="recurring">Recurring</TabsTrigger>
            </TabsList>

            <div className="space-y-6 pt-4">
                 <div className="space-y-3">
                    <label className="text-sm font-medium leading-none">
                        Amount ({project.currency})
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₦</span>
                        <Input
                            type="text"
                            placeholder="1,000"
                            className="pl-8 text-lg font-medium"
                            value={formatNumberInput(amount)}
                            onChange={handleAmountChange}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2 text-xs flex-wrap">
                        {['1000', '5000', '10000', '25000'].map((val) => (
                            <button 
                                key={val}
                                onClick={() => setQuickAmount(val)}
                                className="bg-card border border-border px-3 py-2 rounded-xl hover:border-primary hover:text-primary transition-colors font-medium"
                            >
                                ₦{Number(val).toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

                {donationType === 'recurring' && (
                    <div className="space-y-3 animate-in fade-in-0 duration-300">
                        <label className="text-sm font-medium leading-none">Frequency</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setInterval('WEEKLY')}
                                className={cn("flex items-center justify-center p-3 rounded-xl border transition-colors",
                                    interval === 'WEEKLY' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/50 hover:border-border'
                                )}
                            >
                                <Repeat className="mr-2 h-4 w-4" /> Weekly
                            </button>
                            <button
                                onClick={() => setInterval('MONTHLY')}
                                className={cn("flex items-center justify-center p-3 rounded-xl border transition-colors",
                                    interval === 'MONTHLY' ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/50 hover:border-border'
                                )}
                            >
                                <Repeat className="mr-2 h-4 w-4" /> Monthly
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-secondary/50 p-4 rounded-xl text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>First donation will be charged immediately.</span>
                    </div>
                    {donationType === 'recurring' && (
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span>Future donations will occur automatically.</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={onCloseAndReset} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading} className="min-w-[120px]">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                    </Button>
                </div>
            </div>
        </Tabs>
    </Modal>
  );
}