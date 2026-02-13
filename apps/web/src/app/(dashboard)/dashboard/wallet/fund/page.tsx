'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2, ShieldCheck, MailCheck, RefreshCw } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/card';
import { ApiService } from '../../../../../services/api';
import { formatNumberInput, parseFormattedNumber } from '../../../../../lib/utils/format';
import { getCookie } from 'cookies-next';
import { cn } from '../../../../../lib/utils/cn';
import toast from 'react-hot-toast';

export default function FundWalletPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);

  const checkVerification = () => {
    const userCookie = getCookie('givar_user');
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie as string);
        setIsUnverified(user.emailVerified === false);
      } catch (e) {
        setIsUnverified(false);
      }
    }
  };

  useEffect(() => {
    checkVerification();
  }, []);

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const freshUser = await ApiService.auth.getMe();
      if (freshUser.emailVerified) {
        setIsUnverified(false);
        toast.success("Identity verified. Wallet access restored.");
      } else {
        toast.error("Verification still pending");
      }
    } catch (error) {
      toast.error("Status check failed");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUnverified) return;
    setAmount(parseFormattedNumber(formatNumberInput(e.target.value)));
  };

  const setQuickAmount = (val: string) => {
    if (isUnverified) return;
    setAmount(val);
  };

  const handleFund = async () => {
    if (isUnverified) return;
    if (!amount || isNaN(Number(amount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const minorAmount = (Number(amount) * 100).toString();
      const data = await ApiService.wallet.fund({
        amount: minorAmount,
        currency: 'NGN',
      });

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch (error: any) {
      setIsLoading(false);
      const message = error.response?.data?.message || 'Payment initialization failed';
      toast.error(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 min-w-0">

      <div className="flex flex-col gap-4 px-1 min-w-0">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="w-fit pl-0 text-muted-foreground hover:text-foreground group rounded-3xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Wallet
        </Button>
      </div>

      <Card className="border-border/40 shadow-xl overflow-hidden rounded-[32px] relative min-w-0 bg-card">
        {isUnverified && (
          <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <div className="h-16 w-16 rounded-[24px] bg-rose-500/10 text-rose-600 flex items-center justify-center mb-6 shadow-xl border border-rose-500/20">
              <MailCheck className="h-8 w-8" />
            </div>
            <div className="space-y-2 max-w-[320px] mx-auto min-w-0">
              <h4 className="text-lg font-bold text-foreground leading-tight">Identity verification pending</h4>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Wallet funding is restricted until you verify your email address. Please check your inbox for the activation link.
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-8 rounded-3xl h-11 px-8 border-rose-500/20 text-rose-600 font-bold text-xs hover:bg-rose-500/5 transition-all gap-2"
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
            >
              {isRefreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Check verification status
            </Button>
          </div>
        )}

        <CardHeader className="pt-8 px-6 md:px-8 border-b border-border/40 bg-muted/10">
          <div className="flex items-center gap-4 mb-1 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20 shadow-inner">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg md:text-xl font-bold">Top up wallet</CardTitle>
              <CardDescription className="text-xs font-medium">
                Securely fund your Givar node via Paystack gateway.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className={cn(
          "p-6 md:p-8 space-y-10 transition-all duration-500 min-w-0",
          isUnverified && "opacity-20 grayscale blur-[1px] pointer-events-none"
        )}>
          <div className="space-y-4 min-w-0">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
              Deposit amount
            </label>
            <div className="relative min-w-0">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground/60">₦</span>
              <Input
                type="text"
                placeholder="5,000"
                className="pl-12 h-16 text-3xl font-bold rounded-[22px] bg-muted/20 border-border/40 focus:bg-background focus:border-primary/40 transition-all tabular-nums"
                value={formatNumberInput(amount)}
                onChange={handleAmountChange}
                autoFocus={!isUnverified}
                disabled={isUnverified}
              />
            </div>

            <div className="flex gap-2 text-xs flex-wrap pt-2 min-w-0">
              {['2000', '5000', '10000', '25000', '50000'].map((val) => (
                <button
                  key={val}
                  onClick={() => setQuickAmount(val)}
                  disabled={isUnverified}
                  className="bg-muted/40 hover:bg-primary hover:text-white border border-border/40 px-4 py-2 rounded-3xl transition-all font-bold text-xs disabled:opacity-50 shadow-sm"
                >
                  ₦{Number(val).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-5 rounded-[24px] flex items-start gap-4 shadow-inner min-w-0">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Transactions are encrypted and processed by Paystack. Givar does not store your sensitive card information on the ledger.
            </p>
          </div>

          <Button
            onClick={handleFund}
            disabled={isLoading || !amount || isUnverified}
            className="w-full h-12 text-sm font-bold rounded-3xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all border-0"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              isUnverified ? 'Verification Required' : 'Proceed to Gateway'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}