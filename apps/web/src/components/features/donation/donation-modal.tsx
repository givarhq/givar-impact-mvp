'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2, Repeat, Wallet, CreditCard, CheckCircle, Mail } from 'lucide-react';
import { Modal } from '../../ui/modal';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Project, Wallet as WalletType } from '../../../types';
import { ApiService } from '../../../services/api';
import { formatNumberInput, parseFormattedNumber, formatCurrency } from '../../../lib/utils/format';
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
  const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'direct' | null>(null);
  
  // Guest Logic
  const isGuest = !wallet;
  const [guestEmail, setGuestEmail] = useState('');

  const donationAmountMinor = BigInt(parseFormattedNumber(amount) || '0') * 100n;
  const walletBalanceMinor = BigInt(wallet?.balance || '0');
  const hasSufficientFunds = !isGuest && walletBalanceMinor >= donationAmountMinor;

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setGuestEmail('');
      setSelectedMethod(null);
      setIsLoading(false);
      setDonationType('one-time');
    }
  }, [isOpen]);

  if (!project) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(parseFormattedNumber(formatNumberInput(e.target.value)));
    if (isGuest) {
        setSelectedMethod('direct'); // Auto-select direct for guests
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
            const endpoint = donationType === 'one-time' ? '/donations' : '/donations/subscribe';
            
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
            onCloseAndReset();
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

  const onCloseAndReset = () => {
    onClose();
    setTimeout(() => {
        setAmount('');
        setGuestEmail('');
        setDonationType('one-time');
        setInterval('MONTHLY');
        setSelectedMethod(null);
    }, 200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCloseAndReset}
      title={`Support ${project.title}`}
      description="Your contribution goes directly to this cause."
    >
        {isGuest ? (
            // GUEST VIEW (Simplified)
            <div className="flex flex-col h-full space-y-5 pt-4">
                 <div className="space-y-3">
                    <label className="text-sm font-medium">Amount ({project.currency})</label>
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

                <div className="space-y-2 animate-in fade-in-0 slide-in-from-top-1">
                    <label className="text-sm font-medium">Receipt Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="email" 
                            placeholder="jane@example.com" 
                            className="pl-9"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/50 border border-dashed border-border text-center text-xs text-muted-foreground">
                    <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link> to track donations and set up recurring giving.
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={onCloseAndReset} disabled={isLoading} className="rounded-xl">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isLoading || !amount || !guestEmail} className="min-w-[150px] rounded-xl">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue to Pay'}
                    </Button>
                </div>
            </div>
        ) : (
            // LOGGED IN VIEW (Full Features with Scroll Fix)
            <Tabs value={donationType} onValueChange={(v) => setDonationType(v as 'one-time' | 'recurring')} className="w-full flex flex-col h-full">
                
                {/* Header: Tabs */}
                <div className="shrink-0 pt-2 pb-4">
                    <TabsList className="w-full">
                        <TabsTrigger value="one-time" className="flex-1">One-Time</TabsTrigger>
                        <TabsTrigger value="recurring" className="flex-1">Recurring</TabsTrigger>
                    </TabsList>
                </div>

                {/* Scrollable Body Area */}
                <div className="flex-1 overflow-y-auto max-h-[55vh] px-1 -mx-1 space-y-5">
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Amount ({project.currency})</label>
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
                    
                    {amount && (
                        <div className="space-y-3 pt-2 animate-in fade-in-0 duration-300 pb-2">
                            <p className="text-sm font-medium">Payment Method</p>
                            <button
                                onClick={() => setSelectedMethod('wallet')}
                                disabled={!hasSufficientFunds}
                                className={cn(
                                    "w-full h-auto justify-start p-4 text-left border rounded-xl transition-all relative",
                                    selectedMethod === 'wallet' ? "border-primary ring-2 ring-primary/50 bg-primary/5" : "hover:border-border hover:bg-muted/30",
                                    !hasSufficientFunds && "opacity-50 cursor-not-allowed grayscale"
                                )}
                            >
                                {selectedMethod === 'wallet' && <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-primary" />}
                                <div className="flex">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 mr-4 text-primary shrink-0"><Wallet className="h-5 w-5" /></div>
                                    <div>
                                        <p className="font-semibold text-foreground">Use Givar Wallet</p>
                                        <p className="text-xs text-muted-foreground">Balance: {formatCurrency(wallet?.balance || '0', project.currency)}</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setSelectedMethod('direct')}
                                disabled={donationType === 'recurring'}
                                className={cn(
                                    "w-full h-auto justify-start p-4 text-left border rounded-xl transition-all relative",
                                    selectedMethod === 'direct' ? "border-primary ring-2 ring-primary/50 bg-primary/5" : "hover:border-border hover:bg-muted/30",
                                    donationType === 'recurring' && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {selectedMethod === 'direct' && <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-primary" />}
                                <div className="flex">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted mr-4 text-muted-foreground shrink-0"><CreditCard className="h-5 w-5" /></div>
                                    <div>
                                        <p className="font-semibold text-foreground">Donate Directly</p>
                                        <p className="text-xs text-muted-foreground">Pay with Card, Bank, USSD</p>
                                    </div>
                                </div>
                                {donationType === 'recurring' && <p className="text-xs text-amber-600 mt-2">Direct payment is unavailable for recurring donations.</p>}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer: Action Buttons (Sticky) */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2 shrink-0 bg-card">
                    <Button variant="outline" onClick={onCloseAndReset} disabled={isLoading} className="rounded-xl">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isLoading || !amount || !selectedMethod} className="min-w-[150px] rounded-xl">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Proceed'}
                    </Button>
                </div>
            </Tabs>
        )}
    </Modal> 
  );
}