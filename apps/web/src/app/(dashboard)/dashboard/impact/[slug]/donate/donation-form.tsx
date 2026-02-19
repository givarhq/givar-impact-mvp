'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    Loader2, Wallet, CreditCard, CheckCircle, Mail,
    Lock, AlertCircle, Eye, MailCheck, Plus, RefreshCw
} from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { Input } from '../../../../../../components/ui/input';
import { Project, Wallet as WalletType } from '../../../../../../types';
import { ApiService } from '../../../../../../services/api';
import { formatNumberInput, parseFormattedNumber, formatCurrency } from '../../../../../../lib/utils/format';
import { Tabs, TabsList, TabsTrigger } from '../../../../../../components/ui/tabs';
import { getCookie } from 'cookies-next';
import { cn } from '../../../../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

export interface DonationFormProps {
    project: Project | null;
    wallet: WalletType | null;
    isAuthenticated: boolean;
}

export function DonationForm({ project, wallet, isAuthenticated }: DonationFormProps) {
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [donationType, setDonationType] = useState<'one-time' | 'recurring'>('one-time');
    const [interval, setInterval] = useState<'WEEKLY' | 'MONTHLY'>('MONTHLY');
    const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'direct' | null>(null);

    const [isReadOnly, setIsReadOnly] = useState(false);
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
        const impersonating = getCookie('givar_is_impersonating') === 'true';
        setIsReadOnly(impersonating);
        checkVerification();

        setAmount('');
        setIsLoading(false);
        if (!isAuthenticated) {
            setSelectedMethod('direct');
        } else {
            setSelectedMethod(null);
        }
    }, [project, isAuthenticated]);

    const handleRefreshStatus = async () => {
        setIsRefreshing(true);
        try {
            const freshUser = await ApiService.auth.getMe();
            if (freshUser.emailVerified) {
                setIsUnverified(false);
                toast.success("Identity verified. Access restored.");
            } else {
                toast.error("Status: still pending");
            }
        } catch (error) {
            toast.error("Verification check failed");
        } finally {
            setIsRefreshing(false);
        }
    };

    const isGuest = !isAuthenticated;
    const [guestEmail, setGuestEmail] = useState('');

    const donationAmountMinor = BigInt(parseFormattedNumber(amount) || '0') * 100n;
    const walletBalanceMinor = BigInt(wallet?.balance || '0');

    const isWalletMethod = selectedMethod === 'wallet';
    const hasSufficientFunds = !isGuest && walletBalanceMinor >= donationAmountMinor;
    const needsFunding = isWalletMethod && !hasSufficientFunds && donationAmountMinor > 0n;

    const targetAmountMinor = BigInt(project?.targetAmount || '0');
    const raisedAmountMinor = BigInt(project?.raisedAmount || '0');
    const remainingNeededMinor = targetAmountMinor - raisedAmountMinor;

    const isCompletingProject = donationAmountMinor >= remainingNeededMinor && remainingNeededMinor > 0n;

    if (!project) return null;

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(parseFormattedNumber(formatNumberInput(e.target.value)));
    };

    const setQuickAmount = (val: string) => {
        setAmount(val);
    };

    const handleConfirm = async () => {
        if (isReadOnly || isUnverified) return;

        if (needsFunding) {
            router.push('/dashboard/wallet/fund');
            return;
        }

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
                    payload.guestName = 'Guest donor';
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
        <div className="bg-card border border-border/40 rounded-3xl p-5 md:p-6 shadow-sm relative overflow-hidden">
            <AnimatePresence>
                {isReadOnly && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 bg-background/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="h-14 w-14 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 border border-amber-500/20">
                            <Eye className="h-6 w-6" />
                        </div>
                        <h4 className="text-lg font-bold text-foreground tracking-tight">Audit mode active</h4>
                        <p className="text-xs text-muted-foreground mt-2 max-w-[280px] leading-relaxed font-medium">
                            You are viewing from a support perspective. Transactions are disabled to preserve ledger integrity.
                        </p>
                    </motion.div>
                )}

                {!isReadOnly && isUnverified && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 bg-background/80 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="h-14 w-14 rounded-3xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4 border border-rose-500/20">
                            <MailCheck className="h-6 w-6" />
                        </div>
                        <h4 className="text-lg font-bold text-foreground tracking-tight">Identity pending</h4>
                        <p className="text-xs text-muted-foreground mt-2 max-w-[280px] leading-relaxed font-medium">
                            To maintain a secure financial environment, donations are restricted until you verify your email address.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-6 rounded-3xl h-10 px-6 border-rose-500/20 text-rose-600 hover:bg-rose-500/5 font-bold text-xs gap-2"
                            onClick={handleRefreshStatus}
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            Check verification status
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={cn(
                "flex flex-col h-full space-y-5 transition-all duration-300",
                (isReadOnly || isUnverified) && "opacity-20 grayscale pointer-events-none blur-[1px]"
            )}>
                <AnimatePresence mode="wait">
                    {isGuest ? (
                        <motion.div
                            key="guest-form"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-5"
                        >
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold text-muted-foreground">Donation amount ({project.currency})</label>
                                    <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                        Remaining: {formatCurrency(remainingNeededMinor, project.currency)}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₦</span>
                                    <Input
                                        type="text"
                                        placeholder="1,000"
                                        className="pl-10 h-12 text-lg font-bold rounded-3xl bg-muted/30 border-transparent focus:bg-background focus:border-primary tabular-nums"
                                        value={formatNumberInput(amount)}
                                        onChange={handleAmountChange}
                                    />
                                </div>
                                <div className="flex gap-2 text-xs flex-wrap">
                                    {['1000', '5000', '10000', '25000'].map((val) => (
                                        <button key={val} onClick={() => setQuickAmount(val)} className="bg-secondary/50 hover:bg-primary hover:text-white border border-border/50 px-3 py-1.5 rounded-3xl transition-all font-semibold">
                                            ₦{Number(val).toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-xs font-bold text-muted-foreground">Receipt email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="jane@example.com"
                                        className="pl-11 h-12 rounded-3xl bg-muted/30 border-transparent text-sm"
                                        value={guestEmail}
                                        onChange={(e) => setGuestEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="auth-form"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Tabs value={donationType} onValueChange={(v) => setDonationType(v as 'one-time' | 'recurring')} className="w-full flex flex-col h-full">
                                <div className="shrink-0 pb-5">
                                    <TabsList className="w-full h-11 rounded-3xl p-1 bg-muted/50 border border-border/40">
                                        <TabsTrigger value="one-time" className="flex-1 rounded-3xl text-xs font-bold h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">One-time</TabsTrigger>
                                        <TabsTrigger value="recurring" className="flex-1 rounded-3xl text-xs font-bold h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Recurring</TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-xs font-bold text-muted-foreground">Amount ({project.currency})</label>
                                            <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                Needed: {formatCurrency(remainingNeededMinor, project.currency)}
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₦</span>
                                            <Input
                                                type="text"
                                                placeholder="1,000"
                                                className="pl-10 h-12 text-lg font-bold rounded-3xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/50 tabular-nums"
                                                value={formatNumberInput(amount)}
                                                onChange={handleAmountChange}
                                            />
                                        </div>
                                        <div className="flex gap-2 text-xs flex-wrap">
                                            {['1000', '5000', '10000', '25000'].map((val) => (
                                                <button key={val} onClick={() => setQuickAmount(val)} className="bg-secondary/50 hover:bg-primary hover:text-white border border-border/50 px-3 py-1.5 rounded-3xl transition-all font-semibold">
                                                    ₦{Number(val).toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {donationType === 'recurring' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="grid grid-cols-2 gap-3 pt-1 overflow-hidden"
                                            >
                                                <button onClick={() => setInterval('WEEKLY')} className={cn("h-11 rounded-3xl border transition-all text-xs font-bold", interval === 'WEEKLY' ? "bg-primary text-white border-primary shadow-sm" : "bg-muted/30 hover:border-border/80 text-muted-foreground")}>Weekly</button>
                                                <button onClick={() => setInterval('MONTHLY')} className={cn("h-11 rounded-3xl border transition-all text-xs font-bold", interval === 'MONTHLY' ? "bg-primary text-white border-primary shadow-sm" : "bg-muted/30 hover:border-border/80 text-muted-foreground")}>Monthly</button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {amount && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-2.5 pt-3 border-t border-border/40"
                                            >
                                                <p className="text-xs font-bold text-muted-foreground">Payment method</p>
                                                <button
                                                    onClick={() => setSelectedMethod('wallet')}
                                                    className={cn(
                                                        "w-full h-auto flex items-center p-3 border rounded-3xl transition-all relative active:scale-[0.98]",
                                                        selectedMethod === 'wallet' ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border/40 hover:border-border/80 hover:bg-muted/30"
                                                    )}
                                                >
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-primary/10 mr-3 text-primary border border-primary/10 shrink-0"><Wallet className="h-4.5 w-4.5" /></div>
                                                    <div className="text-left flex-1 min-w-0">
                                                        <p className="font-bold text-sm text-foreground truncate">Givar wallet</p>
                                                        <p className={cn("text-xs font-medium truncate", !hasSufficientFunds && donationAmountMinor > 0n ? "text-destructive" : "text-muted-foreground")}>
                                                            Balance: {formatCurrency(wallet?.balance || '0', project.currency)}
                                                        </p>
                                                    </div>
                                                    {selectedMethod === 'wallet' && <CheckCircle className="ml-2 h-5 w-5 text-primary shrink-0" />}
                                                </button>

                                                <button
                                                    onClick={() => setSelectedMethod('direct')}
                                                    className={cn(
                                                        "w-full h-auto flex items-center p-3 border rounded-3xl transition-all relative active:scale-[0.98]",
                                                        selectedMethod === 'direct' ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border/40 hover:border-border/80 hover:bg-muted/30"
                                                    )}
                                                >
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-muted mr-3 text-muted-foreground border border-border/40 shrink-0"><CreditCard className="h-4.5 w-4.5" /></div>
                                                    <div className="text-left flex-1 min-w-0"><p className="font-bold text-sm text-foreground truncate">Direct pay</p><p className="text-xs font-medium text-muted-foreground truncate">Card, bank transfer</p></div>
                                                    {selectedMethod === 'direct' && <CheckCircle className="ml-2 h-5 w-5 text-primary shrink-0" />}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </Tabs>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {amount && isCompletingProject && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-start gap-2.5 p-3 rounded-3xl bg-primary/5 border border-primary/10 text-primary overflow-hidden"
                        >
                            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <div className="text-xs space-y-0.5">
                                <p className="font-bold">Final contribution</p>
                                <p className="font-medium">
                                    This gift will complete the project goal. Any surplus will be reallocated to urgent causes on the ledger.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center justify-center">
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || !amount || (isGuest && !guestEmail) || (!isGuest && !selectedMethod)}
                        className={cn(
                            "w-[12rem] h-12 text-sm font-bold rounded-3xl shadow-sm transition-all mt-2",
                            needsFunding ? "bg-secondary text-foreground hover:bg-secondary/80 border border-border/60" : "bg-primary text-white hover:bg-primary/90"
                        )}
                    >
                        {isLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : (
                            <span className="flex items-center gap-2">
                                {needsFunding ? (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        Fund wallet
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4" />
                                        {isGuest ? 'Proceed to pay' : 'Confirm donation'}
                                    </>
                                )}
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}