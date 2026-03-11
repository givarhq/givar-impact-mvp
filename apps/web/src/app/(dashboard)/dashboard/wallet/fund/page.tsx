'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Loader2, ShieldCheck, MailCheck, RefreshCw, Globe } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { ApiService } from '../../../../../services/api';
import { formatNumberInput, parseFormattedNumber } from '../../../../../lib/utils/format';
import { getCookie } from 'cookies-next';
import { cn } from '../../../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  CAD: 'C$',
};

const QUICK_AMOUNTS: Record<string, string[]> = {
  NGN: ['2000', '5000', '10000', '25000', '50000'],
  USD: ['20', '50', '100', '250', '500'],
  GBP: ['20', '50', '100', '250', '500'],
  EUR: ['20', '50', '100', '250', '500'],
  CAD: ['20', '50', '100', '250', '500'],
};

export default function FundWalletPage() {
  const [displayCurrency, setDisplayCurrency] = useState('NGN');
  const [displayAmount, setDisplayAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [fxRates, setFxRates] = useState<Record<string, number> | null>(null);

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

    fetch('https://open.er-api.com/v6/latest/NGN')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setFxRates(data.rates);
        }
      })
      .catch(console.error);
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
    setDisplayAmount(parseFormattedNumber(formatNumberInput(e.target.value)));
  };

  const setQuickAmount = (val: string) => {
    if (isUnverified) return;
    setDisplayAmount(val);
  };

  const getNGNAmount = (): number | null => {
    const numAmount = Number(parseFormattedNumber(displayAmount));
    if (!numAmount) return 0;
    if (displayCurrency === 'NGN') return numAmount;

    // Safety Guard: API failure resilience
    if (!fxRates || !fxRates[displayCurrency]) return null;

    return numAmount / fxRates[displayCurrency];
  };

  const ngnValue = getNGNAmount();

  const handleFund = async () => {
    if (isUnverified) return;

    if (ngnValue === null) {
      toast.error("Exchange rates are currently unavailable. Please try funding in NGN.");
      return;
    }

    if (!displayAmount || ngnValue <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Logic Guard: Prevent tiny deposits after FX (Paystack minimum ₦100)
    const baseAmountMinor = BigInt(Math.round(ngnValue * 100));
    if (baseAmountMinor < 10000n) {
      toast.error("Minimum top-up is ₦100.00 equivalent.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await ApiService.wallet.fund({
        amount: baseAmountMinor.toString(),
        currency: 'NGN',
        donorCurrency: displayCurrency,
        donorAmount: displayAmount,
        fxRate: fxRates ? fxRates[displayCurrency] : undefined
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
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20 min-w-0">

      <div className="flex flex-col gap-4 px-1 min-w-0">
        <Link href="/dashboard/history">
          <Button
            variant="ghost"
            className="w-fit pl-0 text-muted-foreground hover:text-foreground group rounded-3xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Go Back
          </Button>
        </Link>
      </div>

      <Card className="border-border/40 shadow-xl overflow-hidden rounded-3xl relative min-w-0 bg-card">
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
              <CardTitle className="text-lg md:text-xl font-bold">Top Up Wallet</CardTitle>
              <CardDescription className="text-xs font-medium">
                Securely fund your Givar Wallet via Paystack gateway.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className={cn(
          "p-6 md:p-8 space-y-10 transition-all duration-500 min-w-0",
          isUnverified && "opacity-20 grayscale blur-[1px] pointer-events-none"
        )}>
          <div className="space-y-4 min-w-0">
            <label className="text-xs font-bold text-muted-foreground ml-1">
              Select currency & amount
            </label>

            <div className="flex gap-2 min-w-0">
              <Select value={displayCurrency} onValueChange={(v) => { setDisplayCurrency(v); setDisplayAmount(''); }}>
                <SelectTrigger className="w-[90px] md:w-[110px] h-14 md:h-16 rounded-2xl md:rounded-[22px] bg-muted/30 border-transparent focus:bg-background focus:ring-primary/20 font-bold text-xs md:text-sm shadow-none transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 shadow-xl">
                  <SelectItem value="NGN" className="font-bold text-xs py-2">NGN ₦</SelectItem>
                  <SelectItem value="USD" className="font-bold text-xs py-2">USD $</SelectItem>
                  <SelectItem value="GBP" className="font-bold text-xs py-2">GBP £</SelectItem>
                  <SelectItem value="EUR" className="font-bold text-xs py-2">EUR €</SelectItem>
                  <SelectItem value="CAD" className="font-bold text-xs py-2">CAD C$</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative min-w-0 flex-1">
                <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-xl md:text-2xl font-bold text-muted-foreground/60 transition-all">
                  {SYMBOLS[displayCurrency]}
                </span>
                <Input
                  type="text"
                  placeholder={displayCurrency === 'NGN' ? "5,000" : "100"}
                  maxLength={14}
                  className="pl-6 md:pl-8 pr-4 h-14 md:h-16 text-xl md:text-3xl font-bold rounded-3xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/50 tabular-nums w-full transition-all"
                  value={formatNumberInput(displayAmount)}
                  onChange={handleAmountChange}
                  disabled={isUnverified}
                />
              </div>
            </div>

            <div className="flex gap-2 text-xs flex-wrap pt-1 min-w-0">
              {(QUICK_AMOUNTS[displayCurrency] || QUICK_AMOUNTS.NGN).map((val) => (
                <button
                  key={val}
                  onClick={() => setQuickAmount(val)}
                  disabled={isUnverified}
                  className="bg-muted/40 hover:bg-primary hover:text-white border border-border/40 px-4 py-2 rounded-3xl transition-all font-bold text-xs disabled:opacity-50 shadow-sm"
                >
                  {SYMBOLS[displayCurrency]}{Number(val).toLocaleString()}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {displayCurrency !== 'NGN' && ngnValue !== null && ngnValue > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-2xl text-blue-800 text-[11px] font-medium leading-relaxed mt-2"
                >
                  <Globe className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                  <p>
                    You will be charged approximately <strong>₦{ngnValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} NGN</strong> (estimated <strong>{SYMBOLS[displayCurrency]}{displayAmount}</strong>).
                    Final debit depends on your bank's exchange rate. International cards accepted.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-5 rounded-[24px] flex items-start gap-4 shadow-inner min-w-0">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Transactions are encrypted & processed by Paystack. Givar does not store your sensitive card information.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={handleFund}
              disabled={isLoading || !displayAmount || isUnverified}
              className="w-auto px-10 h-12 text-sm font-bold rounded-3xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all border-0"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              {isUnverified ? 'Verification Required' : 'Proceed to Gateway'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}