'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
    Loader2, Wallet, CreditCard, CheckCircle, Mail,
    Lock, AlertCircle, Eye, Repeat, MailCheck
} from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { Input } from '../../../../../../components/ui/input';
import { Project, Wallet as WalletType } from '../../../../../../types';
import { ApiService } from '../../../../../../services/api';
import { formatNumberInput, parseFormattedNumber, formatCurrency } from '../../../../../../lib/utils/format';
import { Tabs, TabsList, TabsTrigger } from '../../../../../../components/ui/tabs';
import { getCookie } from 'cookies-next';
import { cn } from '../../../../../../lib/utils/cn';

export interface DonationFormProps {
    project: Project | null;
    wallet: WalletType | null;
    isAuthenticated: boolean;
}

export function DonationForm({ project, wallet, isAuthenticated }: DonationFormProps) {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [donationType, setDonationType] = useState<'one-time' | 'recurring'>('one-time');
    const [interval, setInterval] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');
    const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'direct' | null>(null);

    // Security & Access Guards
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isUnverified, setIsUnverified] = useState(false);

    useEffect(() => {
        // 1. Detection: Support/Impersonation Mode
        const impersonating = getCookie('givar_is_impersonating') === 'true';
        setIsReadOnly(impersonating);

        // 2. Detection: Email Verification Status
        const userCookie = getCookie('givar_user');
        if (userCookie) {
            try {
                const user = JSON.parse(userCookie as string);
                setIsUnverified(user.emailVerified === false);
            } catch (e) {
                setIsUnverified(false);
            }
        }

        // 3. Form Reset
        setAmount('');
        setIsLoading(false);
        if (!isAuthenticated) {
            setSelectedMethod('direct');
        } else {
            setSelectedMethod(null);
        }
    }, [project, isAuthenticated]);

    const isGuest = !isAuthenticated;
    const [guestEmail, setGuestEmail] = useState('');

    const donationAmountMinor = BigInt(parseFormattedNumber(amount) || '0') * 100n;
    const walletBalanceMinor = BigInt(wallet?.balance || '0');
    const hasSufficientFunds = !isGuest && walletBalanceMinor >= donationAmountMinor;

    const targetAmountMinor = BigInt(project?.targetAmount || '0');
    const raisedAmountMinor = BigInt(project?.raisedAmount || '0');
    const remainingNeededMinor = targetAmountMinor - raisedAmountMinor;
    const isOverfunding = donationAmountMinor > remainingNeededMinor;

    if (!project) return null;

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(parseFormattedNumber(formatNumberInput(e.target.value)));
    };

    const setQuickAmount = (val: string) => {
        setAmount(val);
    };

    const handleConfirm = async () => {
        if (isReadOnly || isUnverified || isOverfunding) return;

        if (!selectedMethod || !amount) {
            toast.error("Please select a payment method.");
            return;
        }

        setIsLoading(true);
        try {
            const minorAmount = donationAmountMinor.toString();
            const projectSlug = project.slug;
            const redirectPath = isAuthenticated
                ? `/dashboard/impact/${projectSlug}`
                : `/explore/${projectSlug}`;

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
                toast.success(donationType === 'one-time' ? `Successfully donated!` : `Subscription active!`);
                router.push(redirectPath);
                router.refresh();
            } else if (selectedMethod === 'direct') {
                const payload: any = {
                    projectId: project.id,
                    amount: minorAmount,
                    currency: project.currency,
                };
                if (isGuest) {
                    payload.guestEmail = guestEmail.toLowerCase().trim();
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
        <div className="bg-card border border-border/50 rounded-xl p-6 md:p-8 shadow-xl relative overflow-hidden">

            {/* OVERLAY 1: READ-ONLY (Support Session) - Lowered z-index to stay below header */}
            {isReadOnly && (
                <div className="absolute inset-0 z-20 bg-background/70 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                    <div className="h-16 w-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-6 shadow-xl shadow-amber-500/5">
                        <Eye className="h-8 w-8" />
                    </div>
                    <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Audit Mode</h4>
                    <p className="text-sm text-muted-foreground mt-3 max-w-[280px] leading-relaxed font-medium">
                        You are viewing from a support perspective. Transactions are disabled to preserve ledger integrity.
                    </p>
                </div>
            )}

            {/* OVERLAY 2: UNVERIFIED (Identity Pending) - Lowered z-index to stay below header */}
            {!isReadOnly && isUnverified && (
                <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-lg flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                    <div className="h-16 w-16 rounded-3xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-6 shadow-xl shadow-rose-500/5">
                        <MailCheck className="h-8 w-8" />
                    </div>
                    <h4 className="text-xl font-black text-foreground uppercase tracking-tight">Identity Pending</h4>
                    <p className="text-sm text-muted-foreground mt-3 max-w-[280px] leading-relaxed font-medium">
                        To maintain a secure financial environment, donations are restricted until you verify your email address.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-8 rounded-xl h-12 px-8 border-rose-500/20 text-rose-600 hover:bg-rose-500/5 font-bold"
                        onClick={() => window.location.reload()}
                    >
                        Check Verification Status
                    </Button>
                </div>
            )}

            <div className={cn(
                "flex flex-col h-full space-y-6 transition-all duration-500",
                (isReadOnly || isUnverified) && "opacity-20 grayscale pointer-events-none blur-[1px]"
            )}>
                {isGuest ? (
                    <>
                        <div className="space-y-3">
                            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Donation Amount ({project.currency})</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">₦</span>
                                <Input
                                    type="text"
                                    placeholder="1,000"
                                    className="pl-10 h-14 text-xl font-bold rounded-xl bg-muted/30 border-transparent focus:bg-background focus:border-primary tabular-nums"
                                    value={formatNumberInput(amount)}
                                    onChange={handleAmountChange}
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
                                    className="pl-12 h-14 rounded-xl bg-muted/30 border-transparent"
                                    value={guestEmail}
                                    onChange={(e) => setGuestEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <Tabs value={donationType} onValueChange={(v) => setDonationType(v as 'one-time' | 'recurring')} className="w-full flex flex-col h-full">
                        <div className="shrink-0 pb-6">
                            <TabsList className="w-full h-12 rounded-xl p-1 bg-muted/50">
                                <TabsTrigger value="one-time" className="flex-1 rounded-lg">One-Time</TabsTrigger>
                                <TabsTrigger value="recurring" className="flex-1 rounded-lg">Recurring</TabsTrigger>
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
                                        className="pl-10 h-14 text-xl font-bold rounded-xl bg-muted/30 border-transparent focus:bg-background focus:border-primary tabular-nums"
                                        value={formatNumberInput(amount)}
                                        onChange={handleAmountChange}
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
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button onClick={() => setInterval('WEEKLY')} className={cn("h-12 rounded-xl border transition-all font-bold", interval === 'WEEKLY' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-muted/30 hover:border-border text-muted-foreground")}>Weekly</button>
                                    <button onClick={() => setInterval('MONTHLY')} className={cn("h-12 rounded-xl border transition-all font-bold", interval === 'MONTHLY' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-muted/30 hover:border-border text-muted-foreground")}>Monthly</button>
                                </div>
                            )}

                            {amount && (
                                <div className="space-y-3 pt-4 border-t border-border/50 animate-in fade-in-0 duration-300">
                                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Payment Method</p>
                                    <button
                                        onClick={() => setSelectedMethod('wallet')}
                                        disabled={!hasSufficientFunds || isOverfunding}
                                        className={cn(
                                            "w-full h-auto flex items-center p-4 border rounded-xl transition-all relative",
                                            selectedMethod === 'wallet' ? "border-primary ring-2 ring-primary/50 bg-primary/5" : "hover:border-border hover:bg-muted/30",
                                            (!hasSufficientFunds || isOverfunding) && "opacity-50 cursor-not-allowed grayscale"
                                        )}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mr-4 text-primary"><Wallet className="h-5 w-5" /></div>
                                        <div className="text-left"><p className="font-bold text-foreground">Givar Wallet</p><p className="text-xs text-muted-foreground">Bal: {formatCurrency(wallet?.balance || '0', project.currency)}</p></div>
                                        {selectedMethod === 'wallet' && <CheckCircle className="ml-auto h-5 w-5 text-primary" />}
                                    </button>

                                    <button
                                        onClick={() => setSelectedMethod('direct')}
                                        disabled={isOverfunding}
                                        className={cn(
                                            "w-full h-auto flex items-center p-4 border rounded-xl transition-all relative",
                                            selectedMethod === 'direct' ? "border-primary ring-2 ring-primary/50 bg-primary/5" : "hover:border-border hover:bg-muted/30",
                                            isOverfunding && "opacity-50 cursor-not-allowed grayscale"
                                        )}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted mr-4 text-muted-foreground"><CreditCard className="h-5 w-5" /></div>
                                        <div className="text-left"><p className="font-bold text-foreground">Direct Pay</p><p className="text-xs text-muted-foreground">Card, Bank, USSD</p></div>
                                        {selectedMethod === 'direct' && <CheckCircle className="ml-auto h-5 w-5 text-primary" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </Tabs>
                )}

                {amount && isOverfunding && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                            <p className="font-bold uppercase tracking-tight">Goal Threshold Reached</p>
                            <p>This project only needs <strong>{formatCurrency(remainingNeededMinor.toString(), project.currency)}</strong> to complete. Please adjust.</p>
                        </div>
                    </div>
                )}

                <Button
                    onClick={handleConfirm}
                    disabled={isLoading || !amount || (isGuest && !guestEmail) || (!isGuest && !selectedMethod) || isOverfunding}
                    className="w-full h-16 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                        <span className="flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            {isGuest ? 'Proceed to Pay' : 'Confirm Donation'}
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}