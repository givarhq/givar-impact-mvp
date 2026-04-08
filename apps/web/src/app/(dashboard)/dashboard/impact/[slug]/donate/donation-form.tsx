'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    Loader2, CreditCard, CheckCircle2, Mail,
    Eye, MailCheck, RefreshCw, Globe, Target, BellRing
} from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { Input } from '../../../../../../components/ui/input';
import { Project, Wallet as WalletType } from '../../../../../../types';
import { ApiService } from '../../../../../../services/api';
import { apiClient } from '../../../../../../lib/api-client';
import { formatNumberInput, parseFormattedNumber, formatCurrency } from '../../../../../../lib/utils/format';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../../components/ui/select';
import { getCookie } from 'cookies-next';
import { cn } from '../../../../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostHog } from 'posthog-js/react';

export interface DonationFormProps {
    project: Project | null;
    wallet: WalletType | null;
    isAuthenticated: boolean;
}

const SYMBOLS: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
    CAD: 'C$',
};

const QUICK_AMOUNTS = ['1000', '5000', '10000', '25000'];

export function DonationForm({ project, isAuthenticated }: DonationFormProps) {
    const router = useRouter();
    const posthog = usePostHog();

    const [detectedCurrency, setDetectedCurrency] = useState('NGN');
    const [displayAmount, setDisplayAmount] = useState('');
    const [tipAmount, setTipAmount] = useState('');
    const [feeRule, setFeeRule] = useState<{ percentage: number; optionalTipEnabled: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fxRates, setFxRates] = useState<Record<string, number> | null>(null);

    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [isWaitlistLoading, setIsWaitlistLoading] = useState(false);

    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isUnverified, setIsUnverified] = useState(false);
    const [guestEmail, setGuestEmail] = useState('');

    const checkVerification = () => {
        const userCookie = getCookie('givar_user');
        if (userCookie) {
            try {
                const user = JSON.parse(userCookie as string);
                setIsUnverified(user.emailVerified === false);
                if (user.email && posthog) {
                    posthog.identify(user.id, { email: user.email, name: `${user.firstName} ${user.lastName}` });
                }
            } catch (e) {
                setIsUnverified(false);
            }
        }
    };

    useEffect(() => {
        const impersonating = getCookie('givar_is_impersonating') === 'true';
        setIsReadOnly(impersonating);
        checkVerification();

        setDisplayAmount('');
        setTipAmount('');
        setIsLoading(false);

        const detectCurrency = async () => {
            let finalCurrency = 'USD';
            try {
                const res = await fetch('https://ipapi.co/currency/');
                const ipCurrency = await res.text();
                if (ipCurrency && ['USD', 'GBP', 'EUR', 'CAD', 'NGN'].includes(ipCurrency.trim())) {
                    setDetectedCurrency(ipCurrency.trim());
                    return;
                }
            } catch (e) { }

            try {
                const rawCurrency = Intl.NumberFormat().resolvedOptions().currency;
                const userCurrency = rawCurrency ? String(rawCurrency).toUpperCase() : 'USD';
                if (['USD', 'GBP', 'EUR', 'CAD', 'NGN'].includes(userCurrency)) {
                    finalCurrency = userCurrency;
                }
            } catch (e) { }

            setDetectedCurrency(finalCurrency);
        };
        detectCurrency();

        ApiService.fees.getPublicCurrent().then(setFeeRule).catch(console.error);

        fetch('https://open.er-api.com/v6/latest/NGN')
            .then(res => res.json())
            .then(data => {
                if (data && data.rates) {
                    setFxRates(data.rates);
                }
            })
            .catch(console.error);
    }, [project, isAuthenticated, posthog]);

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

    if (!project) return null;

    // --- PHASED FUNDING LOGIC ---
    const budget = Array.isArray(project.budgetBreakdown) ? project.budgetBreakdown : [];
    const activeIndex = project.currentPhaseIndex || 0;

    let cumulativeMajor = 0;
    for (let i = 0; i <= activeIndex && i < budget.length; i++) {
        cumulativeMajor += (budget[i].amount || (budget[i] as any).cost || 0);
    }
    let currentPhaseCapMinor = BigInt(cumulativeMajor * 100);

    if (budget.length === 0 || activeIndex >= budget.length) {
        currentPhaseCapMinor = BigInt(project.targetAmount || '0');
    }

    const activeItemName = budget[activeIndex] ? (budget[activeIndex].description || (budget[activeIndex] as any).item) : 'Final Phase';
    const raisedAmountMinor = BigInt(project.raisedAmount || '0');
    const remainingForPhaseMinor = currentPhaseCapMinor > raisedAmountMinor ? currentPhaseCapMinor - raisedAmountMinor : 0n;

    const isPhaseFull = remainingForPhaseMinor <= 0n && currentPhaseCapMinor > 0n;

    // --- FINANCIAL CALCULATIONS ---
    const ngnValue = Number(parseFormattedNumber(displayAmount)) || 0;
    const baseAmountMinor = BigInt(Math.round(ngnValue * 100));
    const tipAmountMinor = BigInt(parseFormattedNumber(tipAmount) || '0') * 100n;

    const feePercentage = feeRule?.percentage || 0;
    const feeAmountMinor = (baseAmountMinor * BigInt(Math.round(feePercentage * 100))) / 10000n;
    const totalChargeMinor = baseAmountMinor + feeAmountMinor + tipAmountMinor;

    const isGuest = !isAuthenticated;
    const isCompletingPhase = baseAmountMinor >= remainingForPhaseMinor && remainingForPhaseMinor > 0n;

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        const valueMinor = BigInt(value || '0') * 100n;

        if (valueMinor > remainingForPhaseMinor) {
            toast.error(`Capped at current phase limit: ₦${(Number(remainingForPhaseMinor) / 100).toLocaleString()}`);
            setDisplayAmount((Number(remainingForPhaseMinor) / 100).toString());
        } else {
            setDisplayAmount(value);
        }
    };

    const setQuickAmount = (val: string) => {
        const valueMinor = BigInt(val) * 100n;
        if (valueMinor > remainingForPhaseMinor) {
            toast.error(`Capped at current phase limit: ₦${(Number(remainingForPhaseMinor) / 100).toLocaleString()}`);
            setDisplayAmount((Number(remainingForPhaseMinor) / 100).toString());
        } else {
            setDisplayAmount(val);
        }
    };

    const handleJoinWaitlist = async () => {
        if (!waitlistEmail || !waitlistEmail.includes('@')) return toast.error("Valid email required");
        setIsWaitlistLoading(true);
        try {
            await apiClient.post(`/projects/${project.id}/waitlist`, { email: waitlistEmail });
            toast.success("You'll be notified when the next phase unlocks!");
            setWaitlistEmail('');
        } catch (e: any) {
            toast.success("You've been added to the notification queue!");
            setWaitlistEmail('');
        } finally {
            setIsWaitlistLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (isReadOnly || isUnverified) return;

        if (!displayAmount || ngnValue <= 0) {
            toast.error("Please provide a valid amount.");
            return;
        }

        if (baseAmountMinor < 10000n) {
            toast.error("Minimum donation is ₦100.00.");
            return;
        }

        let finalDonorCurrency = undefined;
        let finalDonorAmount = undefined;
        let finalFxRate = undefined;

        if (detectedCurrency !== 'NGN' && fxRates && fxRates[detectedCurrency]) {
            finalDonorCurrency = detectedCurrency;
            finalDonorAmount = (ngnValue * fxRates[detectedCurrency]).toFixed(2);
            finalFxRate = fxRates[detectedCurrency];
        }

        posthog?.capture('donation_initiated', {
            project_id: project.id,
            display_currency: detectedCurrency,
            calculated_ngn_value: ngnValue,
            payment_method: 'direct',
            is_guest: isGuest
        });

        setIsLoading(true);
        try {
            const minorAmount = baseAmountMinor.toString();
            const minorTipAmount = tipAmountMinor.toString();

            const payload: any = {
                projectId: project.id,
                amount: minorAmount,
                tipAmount: minorTipAmount,
                currency: project.currency,
                donorCurrency: finalDonorCurrency,
                donorAmount: finalDonorAmount,
                fxRate: finalFxRate
            };

            if (isGuest) {
                payload.guestEmail = guestEmail.toLowerCase().trim();
                payload.guestName = 'Guest donor';
            }

            const data = await ApiService.donations.direct(payload);
            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl;
            }
        } catch (error) {
            setIsLoading(false);
        }
    };

    let goalApprox = '';
    if (detectedCurrency !== 'NGN' && fxRates && fxRates[detectedCurrency]) {
        const goalNgnMajor = Number(remainingForPhaseMinor) / 100;
        const convertedGoal = goalNgnMajor * fxRates[detectedCurrency];
        goalApprox = `(≈ ${SYMBOLS[detectedCurrency]}${convertedGoal.toLocaleString(undefined, { maximumFractionDigits: 0 })})`;
    }

    if (isPhaseFull) {
        return (
            <div className="bg-card border border-border/40 rounded-3xl p-6 md:p-10 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="h-20 w-20 bg-emerald-500/10 text-emerald-600 rounded-[28px] flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-3">
                    <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Phase {activeIndex + 1} Fully Funded!</h3>
                    <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
                        Thanks to our incredible donors, the funds for <strong>"{activeItemName}"</strong> have been secured.
                        To ensure total accountability, we have paused donations until the organizer uploads verified proof of execution for this phase.
                    </p>
                </div>
                <div className="bg-muted/20 border border-border/40 p-6 md:p-8 rounded-3xl max-w-md mx-auto space-y-4 shadow-inner">
                    <div className="flex items-center gap-2 justify-center text-primary mb-2">
                        <BellRing className="h-5 w-5" />
                        <h4 className="text-sm font-bold text-foreground">Save the momentum</h4>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium pb-2">Don't miss out. Drop your email to get alerted the second Phase {activeIndex + 2} opens.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                            placeholder="your@email.com"
                            value={waitlistEmail}
                            onChange={e => setWaitlistEmail(e.target.value)}
                            className="h-12 rounded-2xl bg-background shadow-sm text-sm"
                        />
                        <Button
                            onClick={handleJoinWaitlist}
                            disabled={isWaitlistLoading || !waitlistEmail}
                            className="h-12 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 border-0 px-8 transition-all active:scale-95"
                        >
                            {isWaitlistLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Notify Me'}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border/40 rounded-3xl p-5 md:p-8 shadow-sm relative overflow-hidden">
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
                "flex flex-col h-full space-y-6 transition-all duration-300",
                (isReadOnly || isUnverified) && "opacity-20 grayscale pointer-events-none blur-[1px]"
            )}>
                {/* Phase Capping Notification */}
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-[20px] flex items-start gap-3 shadow-inner">
                    <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-primary/90 leading-relaxed font-bold">
                        Transparency Mode: We are currently only raising funds for <span className="text-primary font-black">Phase {activeIndex + 1}</span>. Subsequent phases will unlock once this phase is executed and verified.
                    </p>
                </div>

                <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-bold text-muted-foreground">Enter amount (NGN)</label>
                        <span className="text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/20 shadow-sm flex items-center gap-1.5">
                            Remaining: {formatCurrency(remainingForPhaseMinor, project.currency)} {goalApprox}
                        </span>
                    </div>

                    <div className="relative min-w-0">
                        <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={14}
                            placeholder="₦ 5,000"
                            className="pl-4 pr-4 h-14 md:h-16 text-xl md:text-3xl font-bold rounded-2xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 tabular-nums w-full transition-all overflow-x-auto"
                            value={displayAmount ? `₦ ${formatNumberInput(displayAmount)}` : ''}
                            onChange={handleAmountChange}
                            disabled={isUnverified}
                        />
                    </div>

                    <div className="flex items-center justify-between px-1 mt-1 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                            {detectedCurrency !== 'NGN' ? (
                                <>
                                    <Globe className="h-3.5 w-3.5" />
                                    <span>Estimated equivalent:</span>
                                    {fxRates && ngnValue > 0 ? (
                                        <span className="font-bold text-foreground">
                                            {SYMBOLS[detectedCurrency]}{(ngnValue * fxRates[detectedCurrency]).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </span>
                                    ) : (
                                        <span>--</span>
                                    )}
                                </>
                            ) : (
                                <span className="text-[10px]">All transactions are processed in NGN.</span>
                            )}
                        </div>
                        <Select value={detectedCurrency} onValueChange={setDetectedCurrency} disabled={isUnverified}>
                            <SelectTrigger className="h-7 px-2 py-0 border-none bg-transparent shadow-none text-xs font-bold text-primary focus:ring-0 w-auto gap-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/40 shadow-xl min-w-[80px]">
                                <SelectItem value="NGN" className="text-xs font-bold">NGN</SelectItem>
                                <SelectItem value="USD" className="text-xs font-bold">USD</SelectItem>
                                <SelectItem value="GBP" className="text-xs font-bold">GBP</SelectItem>
                                <SelectItem value="EUR" className="text-xs font-bold">EUR</SelectItem>
                                <SelectItem value="CAD" className="text-xs font-bold">CAD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2 text-xs flex-wrap pt-2">
                        {QUICK_AMOUNTS.map((val) => (
                            <button key={val} onClick={() => setQuickAmount(val)} disabled={isUnverified} className="bg-muted/40 hover:bg-primary hover:text-white border border-border/40 px-4 py-2 rounded-3xl transition-all font-bold text-xs disabled:opacity-50 shadow-sm">
                                ₦{Number(val).toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>

                <AnimatePresence>
                    {displayAmount && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-5 pt-4 border-t border-border/40 overflow-hidden"
                        >
                            {feeRule?.optionalTipEnabled && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground ml-1">Optional tip (Helps cover platform costs)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₦</span>
                                        <Input
                                            type="text"
                                            placeholder="0"
                                            className="pl-10 h-11 text-sm font-bold rounded-3xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/50 tabular-nums"
                                            value={formatNumberInput(tipAmount)}
                                            onChange={(e) => setTipAmount(parseFormattedNumber(formatNumberInput(e.target.value)))}
                                            disabled={isUnverified}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="p-5 rounded-[24px] bg-muted/20 border border-border/40 space-y-3 shadow-inner">
                                <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                                    <span>Phase {activeIndex + 1} Impact</span>
                                    <span className="tabular-nums font-bold text-foreground">₦{(Number(baseAmountMinor) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                                    <span>Platform fee ({feePercentage}%)</span>
                                    <span className="tabular-nums font-bold text-foreground">₦{(Number(feeAmountMinor) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                {tipAmountMinor > 0n && (
                                    <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                                        <span>Platform tip</span>
                                        <span className="tabular-nums font-bold text-foreground">₦{(Number(tipAmountMinor) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-border/40 flex justify-between items-center">
                                    <span className="text-sm font-bold text-foreground">Total charge</span>
                                    <span className="text-sm font-black text-primary tabular-nums">₦{(Number(totalChargeMinor) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-1 opacity-70">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[11px] font-bold text-muted-foreground">Secure one-time direct payment</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isGuest && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2.5 overflow-hidden pt-2"
                        >
                            <label className="text-xs font-bold text-muted-foreground ml-1">Receipt email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="jane@example.com"
                                    className="pl-11 h-12 rounded-3xl bg-muted/30 border-transparent text-sm focus:bg-background"
                                    value={guestEmail}
                                    onChange={(e) => setGuestEmail(e.target.value)}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {displayAmount && isCompletingPhase && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-start gap-2.5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 overflow-hidden shadow-sm"
                        >
                            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                            <div className="text-xs space-y-0.5">
                                <p className="font-bold">Phase Completion Gift</p>
                                <p className="font-medium">
                                    This gift fully funds Phase {activeIndex + 1}! The project will pause to verify vendor execution before opening the next phase.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center justify-center pt-4 border-t border-border/40">
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading || !displayAmount || (isGuest && !guestEmail)}
                        className="w-full sm:w-auto px-10 h-14 text-sm font-bold rounded-3xl shadow-lg shadow-primary/20 transition-all bg-primary text-white hover:bg-primary/90 border-0 active:scale-[0.98]"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                        Proceed to Secure Checkout
                    </Button>
                </div>
            </div>
        </div>
    );
}