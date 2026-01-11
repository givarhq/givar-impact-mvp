'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Repeat, Wallet, CreditCard } from 'lucide-react';
import { Modal } from '../../ui/modal';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Project, Wallet as WalletType } from '../../../types';
import { apiClient } from '../../../lib/api-client';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { cn } from '../../../lib/utils/cn';

export interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  wallet: WalletType | null;
}

export function DonationModal({ isOpen, onClose, project, wallet }: DonationModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [donationType, setDonationType] = useState<'one-time' | 'recurring'>('one-time');
  const [interval, setInterval] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');

  // SOTA UPDATE: Calculate wallet sufficiency
  const donationAmountMinor = BigInt(parseFormattedNumber(amount) || '0') * 100n;
  const walletBalanceMinor = BigInt(wallet?.balance || '0');
  const hasSufficientFunds = walletBalanceMinor >= donationAmountMinor;

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
      const minorAmount = donationAmountMinor.toString();
      
      if (hasSufficientFunds) {
        // --- PATH A: User has balance, use wallet donation ---
        const endpoint = donationType === 'one-time' ? '/donations' : '/donations/subscribe';
        await apiClient.post(endpoint, {
          projectId: project.id,
          amount: minorAmount,
          currency: project.currency,
          interval: donationType === 'recurring' ? interval : undefined,
        });
        toast.success(donationType === 'one-time' ? `Successfully donated!` : `Recurring donation started!`);
      } else {
        // --- PATH B: Insufficient funds, use direct donation (wallet bypass) ---
        if (donationType === 'recurring') {
            toast.error("You must have sufficient funds for the first recurring payment.");
            setIsLoading(false);
            return;
        }
        const { data } = await apiClient.post('/donations/direct', {
            projectId: project.id,
            amount: minorAmount,
            currency: project.currency,
        });
        if (data.authorizationUrl) {
            window.location.href = data.authorizationUrl;
            // No need to setIsLoading(false) here as the page will redirect
            return;
        }
      }

      onCloseAndReset();
      router.refresh();
    } catch (error: any) {
       if (error?.response?.data?.message?.includes('Insufficient')) {
          toast.error('Insufficient funds for this donation.');
       }
       setIsLoading(false);
    } 
    // No finally block here, as redirect path should not reset loading state
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
                        {/* ... your existing recurring UI ... */}
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

                {/* SOTA UPDATE: Dynamic Info Box */}
                <div className="bg-secondary/50 p-4 rounded-xl text-sm text-muted-foreground space-y-2">
                    {hasSufficientFunds || !amount ? (
                        <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-primary" />
                            <span>Your Givar Wallet will be charged.</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-amber-700">
                            <CreditCard className="h-4 w-4" />
                            <span>Your wallet balance is low. You'll be redirected to pay directly.</span>
                        </div>
                    )}
                </div>

                {/* SOTA UPDATE: Dynamic Button Text */}
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={onCloseAndReset} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !amount} className="min-w-[150px]">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> 
                         : hasSufficientFunds || !amount ? 'Confirm Donation' 
                         : 'Proceed to Pay'}
                    </Button>
                </div>
            </div>
        </Tabs>
    </Modal>
  );
}