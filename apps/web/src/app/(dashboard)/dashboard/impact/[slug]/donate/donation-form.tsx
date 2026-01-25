'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2, Repeat, Wallet, CreditCard, CheckCircle, Mail } from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { Input } from '../../../../../../components/ui/input';
import { Project, Wallet as WalletType } from '../../../../../../types';
import { ApiService } from '../../../../../../services/api';
import { formatNumberInput, parseFormattedNumber, formatCurrency } from '../../../../../../lib/utils/format';
import { Tabs, TabsList, TabsTrigger } from '../../../../../../components/ui/tabs';
import { cn } from '../../../../../../lib/utils/cn';

export interface DonationFormProps {
  project: Project | null;
  wallet: WalletType | null;
  isAuthenticated: boolean; // SOTA: Explicit auth prop to fix recognition bug
}

export function DonationForm({ project, wallet, isAuthenticated }: DonationFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [donationType, setDonationType] = useState<'one-time' | 'recurring'>('one-time');
  const [interval, setInterval] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'direct' | null>(null);
  
  // SOTA BUG FIX: User is guest only if they are not authenticated
  const isGuest = !isAuthenticated;
  const [guestEmail, setGuestEmail] = useState('');

  const donationAmountMinor = BigInt(parseFormattedNumber(amount) || '0') * 100n;
  const walletBalanceMinor = BigInt(wallet?.balance || '0');
  const hasSufficientFunds = !isGuest && walletBalanceMinor >= donationAmountMinor;

  useEffect(() => {
      setAmount('');
      setGuestEmail('');
      setSelectedMethod(null);
      setIsLoading(false);
      setDonationType('one-time');
  }, [project]);

  if (!project) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(parseFormattedNumber(formatNumberInput(e.target.value)));
    if (isGuest) {
        setSelectedMethod('direct'); 
    } else {
        setSelectedMethod(null);
    }
  };
  
  const setQuickAmount = (val: string) => {
    setAmount(val);
    if (isGuest) setSelectedMethod('direct');
    else setSelectedMethod(null);
  };

  const handleConfirm = async () => {
    if (!selectedMethod || !amount) {
        toast.error("Please select a payment method.");
        return;
    }

    if (selectedMethod === 'direct' && isGuest && !guestEmail) {
        toast.error("Email is required for guest donations.");
        return;
    }

    setIsLoading(true);
    try {
        const minorAmount = donationAmountMinor.toString();

        if (selectedMethod === 'wallet') {
            if (donationType === 'one-time') {
                await ApiService.donations.create({
                    projectId: project.id,
                    amount: minorAmount,
                    currency: project.currency,
                });
            } else {
                await ApiService.donations.subscribe({
                    projectId: project.id,
                    amount: minorAmount,
                    currency: project.currency,
                    interval,
                });
            }
            toast.success(donationType === 'one-time' ? `Successfully donated!` : `Recurring donation started!`);
            router.push('/dashboard/history');
            router.refresh();
        } else if (selectedMethod === 'direct') {
            const payload: any = {
                projectId: project.id,
                amount: minorAmount,
                currency: project.currency,
            };
            
            if (isGuest) {
                payload.guestEmail = guestEmail;
                payload.guestName = 'Guest Donor';
            }

            const data = await ApiService.donations.direct(payload);
            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl;
            }
        }
    } catch (error) {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {isGuest ? (
            <div className="flex flex-col space-y-6">
                 <div className="space-y-3">
                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Amount ({project.currency})</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">₦</span>
                        <Input
                            type="text"
                            placeholder="1,000"
                            className="pl-10 h-14 text-xl font-bold rounded-2xl bg-muted/30 border-transparent focus:bg-background focus:border-primary tabular-nums"
                            value={formatNumberInput(amount)}
                            onChange={handleAmountChange}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2 text-xs flex-wrap">
                        {['1000', '5000', '10000', '25000'].map((val) => (
                            <button key={val} onClick={() => setQuickAmount(val)} className="bg-secondary/50 hover:bg-primary hover:text-white border border-border/50 px-3 py-2 rounded-xl transition-all font-semibold">
                                ₦{Number(val).toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Receipt Email</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            type="email" 
                            placeholder="jane@example.com" 
                            className="pl-12 h-14 rounded-2xl bg-muted/30 border-transparent"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/50 border border-dashed border-border text-center text-xs text-muted-foreground leading-relaxed">
                    <Link href="/login" className="text-primary hover:underline font-bold">Sign in</Link> to track your impact history and manage automated giving.
                </div>

                <Button onClick={handleConfirm} disabled={isLoading || !amount || !guestEmail} className="w-full h-16 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue to Pay'}
                </Button>
            </div>
        ) : (
            <Tabs value={donationType} onValueChange={(v) => setDonationType(v as 'one-time' | 'recurring')} className="w-full flex flex-col h-full">
                <div className="shrink-0 pb-6">
                    <TabsList className="w-full h-12 rounded-2xl p-1 bg-muted/50">
                        <TabsTrigger value="one-time" className="flex-1 rounded-xl">One-Time</TabsTrigger>
                        <TabsTrigger value="recurring" className="flex-1 rounded-xl">Recurring</TabsTrigger>
                    </TabsList>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Amount ({project.currency})</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">₦</span>
                            <Input
                                type="text"
                                placeholder="1,000"
                                className="pl-10 h-14 text-xl font-bold rounded-2xl bg-muted/30 border-transparent focus:bg-background focus:border-primary tabular-nums"
                                value={formatNumberInput(amount)}
                                onChange={handleAmountChange}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2 text-xs flex-wrap">
                            {['1000', '5000', '10000', '25000'].map((val) => (
                                <button key={val} onClick={() => setQuickAmount(val)} className="bg-secondary/50 hover:bg-primary hover:text-white border border-border/50 px-3 py-2 rounded-xl transition-all font-semibold">
                                    ₦{Number(val).toLocaleString()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {donationType === 'recurring' && (
                        <div className="space-y-3 animate-in fade-in-0 duration-300">
                            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground text-center block">Frequency</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setInterval('WEEKLY')} className={cn("flex items-center justify-center h-12 rounded-2xl border transition-all font-bold", interval === 'WEEKLY' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-muted/30 hover:border-border text-muted-foreground")}>
                                    Weekly
                                </button>
                                <button onClick={() => setInterval('MONTHLY')} className={cn("flex items-center justify-center h-12 rounded-2xl border transition-all font-bold", interval === 'MONTHLY' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-muted/30 hover:border-border text-muted-foreground")}>
                                    Monthly
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {amount && (
                        <div className="space-y-3 pt-4 border-t border-border/50 animate-in fade-in-0 duration-300">
                            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select Payment Method</p>
                            <button
                                onClick={() => setSelectedMethod('wallet')}
                                disabled={!hasSufficientFunds}
                                className={cn(
                                    "w-full h-auto flex items-center p-4 border rounded-2xl transition-all relative",
                                    selectedMethod === 'wallet' ? "border-primary ring-2 ring-primary/50 bg-primary/5" : "hover:border-border hover:bg-muted/30",
                                    !hasSufficientFunds && "opacity-50 cursor-not-allowed grayscale"
                                )}
                            >
                                {selectedMethod === 'wallet' && <CheckCircle className="absolute top-4 right-4 h-5 w-5 text-primary" />}
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mr-4 text-primary shrink-0"><Wallet className="h-5 w-5" /></div>
                                <div className="text-left">
                                    <p className="font-bold text-foreground">Givar Wallet</p>
                                    <p className="text-xs text-muted-foreground">Balance: {formatCurrency(wallet?.balance || '0', project.currency)}</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setSelectedMethod('direct')}
                                disabled={donationType === 'recurring'}
                                className={cn(
                                    "w-full h-auto flex items-center p-4 border rounded-2xl transition-all relative",
                                    selectedMethod === 'direct' ? "border-primary ring-2 ring-primary/50 bg-primary/5" : "hover:border-border hover:bg-muted/30",
                                    donationType === 'recurring' && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {selectedMethod === 'direct' && <CheckCircle className="absolute top-4 right-4 h-5 w-5 text-primary" />}
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted mr-4 text-muted-foreground shrink-0"><CreditCard className="h-5 w-5" /></div>
                                <div className="text-left">
                                    <p className="font-bold text-foreground">Direct Pay</p>
                                    <p className="text-xs text-muted-foreground">Card, Bank, USSD</p>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                <div className="pt-8">
                    <Button onClick={handleConfirm} disabled={isLoading || !amount || !selectedMethod} className="w-full h-16 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20">
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm & Proceed'}
                    </Button>
                </div>
            </Tabs>
        )}
    </div>
  );
}