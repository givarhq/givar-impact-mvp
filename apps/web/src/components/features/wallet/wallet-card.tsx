'use client';

import { useState } from 'react';
import { Eye, EyeOff, Plus, Wallet, ArrowUpRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Modal } from '../../ui/modal';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { ApiService } from '../../../services/api';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import { SmartCurrency } from '../../ui/smart-currency';
import toast from 'react-hot-toast';

interface WalletCardProps {
  balance: string;
  currency: string;
}

export function WalletCard({ balance, currency }: WalletCardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(parseFormattedNumber(formatNumberInput(e.target.value)));
  };

  const setQuickAmount = (val: string) => {
    setAmount(val);
  };

  const handleFund = async () => {
    if (!amount || isNaN(Number(amount))) {
        toast.error('Please enter a valid amount');
        return;
    }
    
    setIsLoading(true);
    try {
        const minorAmount = (Number(amount) * 100).toString();
        
        const data = await ApiService.wallet.fund({
            amount: minorAmount,
            currency: currency
        });

        if (data.authorizationUrl) {
            window.location.href = data.authorizationUrl;
        }
    } catch (error) {
        setIsLoading(false);
    }
  };

  return (
    <>
      <div className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-primary/60 via-primary/10 to-transparent">
        <Card className="relative h-full w-full overflow-hidden bg-card border-none rounded-2xl p-6 flex flex-col justify-between shadow-none min-h-[180px]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-20 pointer-events-none" />
          <Wallet className="absolute -bottom-6 -right-6 h-36 w-36 text-primary opacity-[0.03] pointer-events-none transition-transform group-hover:scale-105 duration-500" />

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm backdrop-blur-md bg-primary/10 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground leading-tight">Total Balance</p>
                <p className="text-sm font-semibold text-foreground">Available Liquidity</p>
              </div>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl" 
                onClick={() => setIsVisible(!isVisible)}
            >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          <div className="relative z-10 mt-7">
            <div className="flex items-end gap-2">
               <h3 className="text-4xl md:text-5xl truncate max-w-full leading-none py-1">
                  <SmartCurrency amount={balance} currency={currency} visible={isVisible} size="large" />
               </h3>
            </div>
          </div>

          <div className="relative z-10 mt-7 flex items-center gap-3">
             <Button 
                onClick={() => setIsFundModalOpen(true)}
                className="h-10 px-5 text-xs font-semibold shadow-lg shadow-primary/20 rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" /> Fund Wallet
            </Button>
            <Button 
                variant="outline"
                className="h-10 px-5 text-xs font-semibold border-border hover:bg-secondary rounded-xl"
            >
              <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
        title="Fund Your Wallet"
        description="Add money securely using Paystack."
      >
        <div className="space-y-5 pt-2">
            <div className="space-y-3">
                <label className="text-sm font-medium leading-none">Amount ({currency})</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₦</span>
                    <Input 
                        type="text" 
                        placeholder="5,000" 
                        className="pl-8 text-lg font-medium" 
                        value={formatNumberInput(amount)}
                        onChange={handleAmountChange}
                        autoFocus
                    />
                </div>
                <div className="flex gap-2 text-xs flex-wrap">
                    {['1000', '5000', '10000', '50000'].map((val) => (
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
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsFundModalOpen(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleFund} isLoading={isLoading} className="min-w-[120px] rounded-xl">
                    Proceed
                </Button>
            </div>
        </div>
      </Modal>
    </>
  );
}