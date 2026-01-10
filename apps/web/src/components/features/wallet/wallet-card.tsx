'use client';

import { useState } from 'react';
import { Eye, EyeOff, Plus, Wallet, ArrowUpRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import { formatCurrency } from '../../../lib/utils/format';
import { apiClient } from '../../../lib/api-client';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface WalletCardProps {
  balance: string;
  currency: string;
}

export function WalletCard({ balance, currency }: WalletCardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFund = async () => {
    if (!amount || isNaN(Number(amount))) {
        toast.error('Please enter a valid amount');
        return;
    }
    
    setIsLoading(true);
    try {
        // API expects major units string? 
        // Our WalletService expects "500000" (Minor) if we pass raw string.
        // Let's standardise: User types "5000". We send "500000".
        const minorAmount = (Number(amount) * 100).toString();

        const { data } = await apiClient.post('/wallet/fund', {
            amount: minorAmount,
            currency: currency
        });

        // Redirect to Paystack
        if (data.authorizationUrl) {
            window.location.href = data.authorizationUrl;
        }
    } catch (error) {
        // Error handled by interceptor
        setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary to-emerald-900 p-6 text-primary-foreground shadow-xl">
        {/* Decorative Circles */}
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-6 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary-foreground/80 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Available Balance
              </p>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold tracking-tight">
                  {isVisible ? formatCurrency(balance, currency) : '••••••••'}
                </h2>
                <button
                  onClick={() => setIsVisible(!isVisible)}
                  className="rounded-full p-1 hover:bg-white/10 transition-colors"
                >
                  {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
                onClick={() => setIsFundModalOpen(true)}
                className="bg-white text-emerald-900 hover:bg-white/90 shadow-sm border-0 font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" /> Fund Wallet
            </Button>
            {/* Placeholder for Withdraw/Transfer in future */}
            <Button 
                variant="outline" 
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw
            </Button>
          </div>
        </div>
      </div>

      {/* Fund Modal Isolated Here */}
      <Modal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
        title="Fund Your Wallet"
        description="Add money securely using Paystack. You will be redirected to complete payment."
      >
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Amount ({currency})</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">₦</span>
                    <Input 
                        type="number" 
                        placeholder="5,000" 
                        className="pl-8 text-lg" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsFundModalOpen(false)}>Cancel</Button>
                <Button onClick={handleFund} isLoading={isLoading}>
                    Proceed to Pay
                </Button>
            </div>
        </div>
      </Modal>
    </>
  );
}