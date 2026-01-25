'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/card';
import { ApiService } from '../../../../../services/api';
import { formatNumberInput, parseFormattedNumber } from '../../../../../lib/utils/format';
import toast from 'react-hot-toast';

export default function FundWalletPage() {
  const router = useRouter();
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
        currency: 'NGN', // Defaulting to NGN for now
      });

      if (data.authorizationUrl) {
        // Redirect to Paystack
        window.location.href = data.authorizationUrl;
      }
    } catch (error) {
      setIsLoading(false);
      toast.error('Failed to initialize payment');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="group text-muted-foreground hover:text-foreground -ml-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Wallet
      </Button>

      <Card className="border-border/50 shadow-xl overflow-hidden rounded-3xl">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
        <CardHeader className="pt-8 px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <CardTitle className="text-2xl font-bold">Add Funds</CardTitle>
          </div>
          <CardDescription className="text-base">
            Securely top up your Givar Wallet via Paystack.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">
              Amount to Deposit
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">₦</span>
              <Input
                type="text"
                placeholder="5,000"
                className="pl-12 h-16 text-3xl font-bold rounded-2xl bg-muted/30 border-transparent focus:bg-background focus:border-primary transition-all tabular-nums"
                value={formatNumberInput(amount)}
                onChange={handleAmountChange}
                autoFocus
              />
            </div>

            <div className="flex gap-2 text-xs flex-wrap pt-2">
              {['2000', '5000', '10000', '25000', '50000'].map((val) => (
                <button
                  key={val}
                  onClick={() => setQuickAmount(val)}
                  className="bg-secondary/50 hover:bg-primary hover:text-white border border-border/50 px-4 py-2.5 rounded-xl transition-all font-semibold"
                >
                  ₦{Number(val).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your transaction is encrypted and processed by Paystack. Givar does not store your card details.
            </p>
          </div>

          <Button 
            onClick={handleFund} 
            disabled={isLoading || !amount} 
            className="w-full h-16 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Proceed to Payment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}