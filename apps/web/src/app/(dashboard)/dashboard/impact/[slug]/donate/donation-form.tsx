'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    Loader2, CreditCard, CheckCircle2, Mail,
    Eye, MailCheck, RefreshCw, Globe, Target, HandHeart
} from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { Input } from '../../../../../../components/ui/input';
import { Project } from '../../../../../../types';
import { ApiService } from '../../../../../../services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../../components/ui/select';
import { getCookie } from 'cookies-next';
import { cn } from '../../../../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { usePostHog } from 'posthog-js/react';

export interface DonationFormProps {
    project: Project | null;
    isAuthenticated: boolean;
}

const SYMBOLS: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
    CAD: 'C$',
};

const formatDecimalInput = (value: string): string => {
    let cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length === 2 && parts[1].length > 2) {
        cleaned = parts[0] + '.' + parts[1].substring(0, 2);
    }
    const finalParts = cleaned.split('.');
    const major = finalParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return finalParts.length > 1 ? `${major}.${finalParts[1]}` : major;
};

const parseDecimalNumber = (value: string): string => {
    return value.replace(/,/g, '');
};

export function DonationForm({ project, isAuthenticated }: DonationFormProps) {
    const router = useRouter();
    const posthog = usePostHog();

    const [detectedCurrency, setDetectedCurrency] = useState('NGN');
    const [displayAmount, setDisplayAmount] = useState('');
    const [tipAmount, setTipAmount] = useState('');
    const [activeTipPreset, setActiveTipPreset] = useState<number | 'custom' | null>(null);

    const [feeRule, setFeeRule] = useState<{ percentage: number; optionalTipEnabled: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fxRates, setFxRates] = useState<Record<string, number> | null>(null);

    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isUnverified, setIsUnverified] = useState(false);
    const [guestEmail, setGuestEmail] = useState('');

    const checkVerification = () => {
        const userCookie = getCookie('givar_user');
        if (userCookie) {
            try {
                const user = JSON.parse(userCookie as string);
                setIsUnverified(user.emailVerified === false);
                if (user.email) {
                    if (posthog) {
                        posthog.identify(user.id, { email: user.email, name: `${user.firstName} ${user.lastName}` });
                    }
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

    useEffect(() => {
        if (typeof activeTipPreset === 'number') {
            const currentAmountNum = Number(parseDecimalNumber(displayAmount)) || 0;
            const newTip = (currentAmountNum * (activeTipPreset / 100)).toFixed(2);
            setTipAmount(newTip === '0.00' ? '' : formatDecimalInput(newTip));
        } else if (activeTipPreset === null) {
            setTipAmount('');
        }
    }, [displayAmount, activeTipPreset]);

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

    // Calculate precise remaining capacity
    const remainingForPhaseMinor = currentPhaseCapMinor > raisedAmountMinor ? currentPhaseCapMinor - raisedAmountMinor : 0n;

    // DUST ROUNDING SYSTEM:
    // If the phase has less than NGN 100 remaining, no one can successfully donate to it.
    // The UI considers it full, allowing the backend admin/system scripts to sweep the dust.
    const isPhaseFull = remainingForPhaseMinor < 10000n && currentPhaseCapMinor > 0n && project.status !== 'FUNDED' && project.status !== 'COMPLETED';

    let remainingSelectedMajor = Number(remainingForPhaseMinor) / 100;
    if (detectedCurrency !== 'NGN' && fxRates && fxRates[detectedCurrency]) {
        remainingSelectedMajor = remainingSelectedMajor * fxRates[detectedCurrency];
    }

    const inputAmountNum = Number(parseDecimalNumber(displayAmount)) || 0;
    const inputTipNum = Number(parseDecimalNumber(tipAmount)) || 0;

    let ngnValue = inputAmountNum;
    let ngnTipValue = inputTipNum;

    if (detectedCurrency !== 'NGN' && fxRates && fxRates[detectedCurrency]) {
        ngnValue = inputAmountNum / fxRates[detectedCurrency];
        ngnTipValue = inputTipNum / fxRates[detectedCurrency];
    }

    const baseAmountMinor = BigInt(Math.round(ngnValue * 100));
    const tipAmountMinor = BigInt(Math.round(ngnTipValue * 100));

    const feePercentage = feeRule?.percentage || 0;
    const feeAmountMinor = (baseAmountMinor * BigInt(Math.round(feePercentage * 100))) / 10000n;

    const isGuest = !isAuthenticated;

    // DUST COMPLETION LOGIC (Frontend reflection of backend policy)
    const gapAfterDonation = remainingForPhaseMinor - baseAmountMinor;
    const isDustCovered = gapAfterDonation > 0n && gapAfterDonation < 10000n;
    const isCompletingPhase = (baseAmountMinor >= remainingForPhaseMinor || isDustCovered) && remainingForPhaseMinor > 0n;

    const QUICK_AMOUNTS = detectedCurrency === 'NGN'
        ? ['1000', '5000', '10000', '25000']
        : ['10', '25', '50', '100'];

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatDecimalInput(e.target.value);
        const rawNum = Number(parseDecimalNumber(formatted));

        if (rawNum > remainingSelectedMajor) {
            toast.error(`Capped at current phase limit: ${SYMBOLS[detectedCurrency]}${remainingSelectedMajor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            setDisplayAmount(formatDecimalInput(remainingSelectedMajor.toFixed(2)));
        } else {
            setDisplayAmount(formatted);
        }
    };

    const setQuickAmount = (val: string) => {
        const rawNum = Number(val);
        if (rawNum > remainingSelectedMajor) {
            toast.error(`Capped at current phase limit: ${SYMBOLS[detectedCurrency]}${remainingSelectedMajor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            setDisplayAmount(formatDecimalInput(remainingSelectedMajor.toFixed(2)));
        } else {
            setDisplayAmount(formatDecimalInput(val));
        }
    };

    const handleConfirm = async () => {
        if (isReadOnly || isUnverified) return;

        if (!displayAmount || inputAmountNum <= 0) {
            toast.error("Please provide a valid amount.");
            return;
        }

        if (baseAmountMinor < 10000n) {
            toast.error(`Minimum donation is ₦100.00 (or equivalent).`);
            return;
        }

        let finalDonorCurrency = undefined;
        let finalDonorAmount = undefined;
        let finalFxRate = undefined;

        if (detectedCurrency !== 'NGN' && fxRates && fxRates[detectedCurrency]) {
            finalDonorCurrency = detectedCurrency;
            finalDonorAmount = inputAmountNum.toString();
            finalFxRate = fxRates[detectedCurrency];
        }

        posthog?.capture('donation_initiated', {
            project_id: project.id,
            display_currency: detectedCurrency,
            calculated_ngn_value: ngnValue,
            payment_method: 'direct',
            is_guest: isGuest,
            included_tip: inputTipNum > 0
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
        goalApprox = `(≈ ${SYMBOLS[detectedCurrency]}${convertedGoal.toLocaleString(undefined, { maximumFractionDigits: 0 })} )`;
    }

    if (isPhaseFull) {
        return (
            <div className="bg-card border border-border/40 rounded-3xl p-6 md:p-10 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="h-20 w-20 bg-emerald-500/10 text-emerald-600 rounded-[28px] flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-3">
                    <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Phase {activeIndex + 1} fully funded!</h3>
                    <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
                        Thanks to our incredible donors, the funds for <strong>"{activeItemName}"</strong> have been secured.
                        Donations are currently paused for this cause.
                    </p>
                </div>
                <div className="pt-4">
                    <Button
                        onClick={() => router.push(isAuthenticated ? `/dashboard/impact/${project.slug}` : `/explore/${project.slug}`)}
                        className="h-12 rounded-3xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 border-0 px-8 transition-all active:scale-95 text-xs"
                    >
                        Return to cause
                    </Button>
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
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-[20px] flex items-start gap-3 shadow-inner">
                    <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-primary/90 leading-relaxed font-bold">
                        Transparency mode: We are currently only raising funds for <span className="text-primary font-black">Phase {activeIndex + 1}</span>. Subsequent phases will unlock once this phase is executed and verified.
                    </p>
                </div>

                <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-bold text-muted-foreground">Enter amount ({detectedCurrency})</label>
                        <span className="text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/20 shadow-sm flex items-center gap-1.5">
                            Remaining: {SYMBOLS[detectedCurrency] || detectedCurrency}{remainingSelectedMajor.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                    </div>

                    <div className="relative min-w-0">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-xl md:text-3xl">
                            {SYMBOLS[detectedCurrency] || detectedCurrency}
                        </span>
                        <Input
                            type="text"
                            inputMode="decimal"
                            maxLength={14}
                            placeholder="0.00"
                            className="pl-14 pr-4 h-14 md:h-16 text-xl md:text-3xl font-bold rounded-2xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 tabular-nums w-full transition-all overflow-x-auto"
                            value={displayAmount}
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
                                            {SYMBOLS['NGN']}{(ngnValue).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </span>
                                    ) : (
                                        <span>--</span>
                                    )}
                                </>
                            ) : (
                                <span className="text-[10px]">All transactions are processed securely in NGN.</span>
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
                                {SYMBOLS[detectedCurrency] || detectedCurrency}{Number(val).toLocaleString()}
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
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-1">
                                        <HandHeart className="h-4 w-4 text-primary" />
                                        <label className="text-xs font-bold text-foreground">Support Givar's infrastructure (optional)</label>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground font-medium px-1 leading-relaxed">
                                        Givar operates on radical transparency. If you value our platform, please consider an optional tip to help us maintain our servers and payment gateways.
                                    </p>

                                    <div className="flex gap-2">
                                        {[5, 10, 15].map(pct => (
                                            <button
                                                key={pct}
                                                onClick={() => setActiveTipPreset(prev => prev === pct ? null : pct)}
                                                className={cn(
                                                    "flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-all",
                                                    activeTipPreset === pct ? "bg-primary text-white border-primary shadow-md" : "bg-card text-muted-foreground border-border/60 hover:border-primary/50"
                                                )}
                                            >
                                                {pct}%
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setActiveTipPreset(prev => prev === 'custom' ? null : 'custom')}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-all",
                                                activeTipPreset === 'custom' ? "bg-primary text-white border-primary shadow-md" : "bg-card text-muted-foreground border-border/60 hover:border-primary/50"
                                            )}
                                        >
                                            Custom
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {activeTipPreset === 'custom' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="relative pt-2"
                                            >
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground mt-1">
                                                    {SYMBOLS[detectedCurrency] || detectedCurrency}
                                                </span>
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="0.00"
                                                    className="pl-10 h-11 text-sm font-bold rounded-2xl bg-muted/30 border-border/40 focus:bg-background tabular-nums"
                                                    value={tipAmount}
                                                    onChange={(e) => {
                                                        const val = formatDecimalInput(e.target.value);
                                                        setTipAmount(val);
                                                    }}
                                                    disabled={isUnverified}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            <div className="p-5 rounded-[24px] bg-muted/20 border border-border/40 space-y-3 shadow-inner">
                                <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                                    <span>Direct impact</span>
                                    <span className="tabular-nums font-bold text-foreground">
                                        {SYMBOLS[detectedCurrency] || detectedCurrency}{(inputAmountNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                                    <span>Payment processing ({feePercentage}%)</span>
                                    <span className="tabular-nums font-bold text-foreground">
                                        {SYMBOLS[detectedCurrency] || detectedCurrency}{((inputAmountNum * feePercentage) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {inputTipNum > 0 && (
                                    <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                                        <span>Platform tip</span>
                                        <span className="tabular-nums font-bold text-foreground">
                                            {SYMBOLS[detectedCurrency] || detectedCurrency}{(inputTipNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-border/40 flex justify-between items-center">
                                    <span className="text-sm font-bold text-foreground">Total checkout</span>
                                    <span className="text-sm font-black text-primary tabular-nums">
                                        {SYMBOLS[detectedCurrency] || detectedCurrency}{(inputAmountNum + ((inputAmountNum * feePercentage) / 100) + inputTipNum).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
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
                            <label className="text-xs font-bold text-muted-foreground ml-1">Receipt delivery email</label>
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
                            className={cn(
                                "flex items-start gap-2.5 p-4 rounded-2xl border overflow-hidden shadow-sm",
                                isDustCovered ? "bg-blue-500/10 border-blue-500/20 text-blue-700" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                            )}
                        >
                            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                            <div className="text-xs space-y-0.5">
                                <p className="font-bold">Phase completion gift</p>
                                <p className="font-medium">
                                    {isDustCovered
                                        ? `Your gift brings us so close that Givar will cover the remaining balance! This fully funds Phase ${activeIndex + 1}.`
                                        : `This gift fully funds Phase ${activeIndex + 1}! The project will pause to verify vendor execution before opening the next phase.`
                                    }
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
                        Proceed to secure checkout
                    </Button>
                </div>
            </div>
        </div>
    );
}