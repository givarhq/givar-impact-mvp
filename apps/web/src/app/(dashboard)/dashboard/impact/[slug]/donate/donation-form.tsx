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
import { calculatePhaseFunding } from '@givar/types';

export interface DonationFormProps {
    project: Project | null;
    isAuthenticated: boolean;
}

const SYMBOLS: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
    CAD: 'C$ ',
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
            // 1. Primary: freeipapi.com (Fastest, Highly Reliable)
            try {
                const res = await fetch('https://freeipapi.com/api/json');
                if (res.ok) {
                    const data = await res.json();
                    const ipCurrency = data.currency?.code;
                    if (ipCurrency && ['USD', 'GBP', 'EUR', 'CAD', 'NGN'].includes(String(ipCurrency).toUpperCase())) {
                        setDetectedCurrency(String(ipCurrency).toUpperCase());
                        return;
                    }
                }
            } catch (e) { }

            // 2. Secondary: ipapi.co
            try {
                const res = await fetch('https://ipapi.co/currency/');
                if (res.ok) {
                    const ipCurrency = await res.text();
                    if (ipCurrency && ['USD', 'GBP', 'EUR', 'CAD', 'NGN'].includes(ipCurrency.trim().toUpperCase())) {
                        setDetectedCurrency(ipCurrency.trim().toUpperCase());
                        return;
                    }
                }
            } catch (e) { }

            // 3. Tertiary: ipwho.is (Robust Fallback)
            try {
                const res = await fetch('https://ipwho.is/');
                if (res.ok) {
                    const data = await res.json();
                    const ipCurrency = data.connection?.currency?.code || data.currency?.code;
                    if (ipCurrency && ['USD', 'GBP', 'EUR', 'CAD', 'NGN'].includes(String(ipCurrency).toUpperCase())) {
                        setDetectedCurrency(String(ipCurrency).toUpperCase());
                        return;
                    }
                }
            } catch (e) { }

            // 4. Absolute Last Resort: OS/Browser Locale
            try {
                const rawCurrency = Intl.NumberFormat().resolvedOptions().currency;
                const userCurrency = rawCurrency ? String(rawCurrency).toUpperCase() : null;
                if (userCurrency && ['USD', 'GBP', 'EUR', 'CAD', 'NGN'].includes(userCurrency)) {
                    setDetectedCurrency(userCurrency);
                    return;
                }
            } catch (e) { }

            setDetectedCurrency('NGN');
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
    const timeline = Array.isArray(project.executionTimeline) ? project.executionTimeline : [];
    const activeIndex = project.currentPhaseIndex || 0;

    const currentStageLogicName = timeline[activeIndex]?.phase || 'Main Stage';
    const cleanStageName = currentStageLogicName.replace(/^Phase \d+:\s*/i, '');

    const stageBudgetItems = budget
        .filter((b: any) => (b.stage || 'Main Stage') === currentStageLogicName)
        .map((b: any) => b.description || b.item)
        .join(', ');

    const currentStageDisplayName = timeline[activeIndex]
        ? `${cleanStageName}${stageBudgetItems ? `: ${stageBudgetItems}` : ''}`
        : 'Main Stage';

    const raisedAmountMinor = BigInt(project.raisedAmount || '0');
    const raisedAmountMajor = Number(raisedAmountMinor) / 100;
    const targetAmountMinor = BigInt(project.targetAmount || '0');

    const isCompleted = project.status === 'COMPLETED';
    const isFundedState = project.status === 'FUNDED' || (raisedAmountMinor >= targetAmountMinor && targetAmountMinor > 0n && !isCompleted);

    const previousStages = timeline.slice(0, activeIndex).map((t: any) => t.phase);
    let previousPhasesMajor = 0;
    let currentPhaseMajor = 0;

    budget.forEach((item: any) => {
        const amt = item.amount || (item as any).cost || 0;
        const itemStage = item.stage || 'Main Stage';
        if (previousStages.includes(itemStage)) {
            previousPhasesMajor += amt;
        } else if (itemStage === currentStageLogicName) {
            currentPhaseMajor += amt;
        }
    });

    const previousPhasesMinor = BigInt(Math.round(previousPhasesMajor * 100));
    let phaseCapMinor = BigInt(Math.round((previousPhasesMajor + currentPhaseMajor) * 100));
    if (timeline.length === 0 || activeIndex >= timeline.length) {
        phaseCapMinor = targetAmountMinor;
    }

    const currentPhaseTargetMinor = phaseCapMinor - previousPhasesMinor;
    let raisedInCurrentPhase = raisedAmountMinor - previousPhasesMinor;
    if (raisedInCurrentPhase < 0n) raisedInCurrentPhase = 0n;

    const remainingForPhaseMinor = currentPhaseTargetMinor > raisedInCurrentPhase ? currentPhaseTargetMinor - raisedInCurrentPhase : 0n;
    const isPhaseFull = remainingForPhaseMinor < 10000n && currentPhaseTargetMinor > 0n && !isFundedState && !isCompleted;

    let cumulativeMajor = 0;
    let activeBudgetItem: any = null;
    let itemRemainingMajor = 0;

    for (const item of budget) {
        const itemAmount = item.amount || (item as any).cost || 0;
        cumulativeMajor += itemAmount;
        if (raisedAmountMajor < cumulativeMajor) {
            activeBudgetItem = item;
            itemRemainingMajor = cumulativeMajor - raisedAmountMajor;
            break;
        }
    }

    if (!activeBudgetItem) {
        itemRemainingMajor = Number(remainingForPhaseMinor) / 100;
    }

    const itemRemainingMinor = BigInt(Math.round(itemRemainingMajor * 100));

    let remainingSelectedMajor = Number(itemRemainingMinor) / 100;
    if (detectedCurrency !== 'NGN' && fxRates && fxRates[detectedCurrency]) {
        remainingSelectedMajor = remainingSelectedMajor * fxRates[detectedCurrency];
    }

    const activeItemName = activeBudgetItem ? (activeBudgetItem.description || activeBudgetItem.item) : 'Final Implementation';

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

    const netAmountMinor = baseAmountMinor + feeAmountMinor + tipAmountMinor;

    let gatewayFeeMinor = 0n;
    if (netAmountMinor > 0n) {
        const isInternational = detectedCurrency !== 'NGN';
        const flatFee = 10000n;
        const threshold = 250000n;
        const divisor = isInternational ? 961n : 985n;

        let chargeMinor = (netAmountMinor * 1000n) / divisor;
        if (chargeMinor >= threshold) {
            chargeMinor = ((netAmountMinor + flatFee) * 1000n) / divisor;
        }

        gatewayFeeMinor = chargeMinor - netAmountMinor;

        if (!isInternational && gatewayFeeMinor > 200000n) {
            gatewayFeeMinor = 200000n;
        }
    }

    const totalCheckoutMinor = netAmountMinor + gatewayFeeMinor;
    const isGuest = !isAuthenticated;

    const gapAfterDonationPhase = remainingForPhaseMinor - baseAmountMinor;
    const isDustCoveredPhase = gapAfterDonationPhase > 0n && gapAfterDonationPhase < 10000n;

    const gapAfterDonationItem = itemRemainingMinor - baseAmountMinor;
    const isItemCovered = gapAfterDonationItem <= 0n;

    const isLastItemInPhase = itemRemainingMinor === remainingForPhaseMinor;
    const isCompletingPhase = isLastItemInPhase && (isItemCovered || isDustCoveredPhase) && remainingForPhaseMinor > 0n;
    const isCompletingItem = !isLastItemInPhase && isItemCovered && itemRemainingMinor > 0n;

    const QUICK_AMOUNTS = detectedCurrency === 'NGN'
        ? ['1000', '5000', '10000', '25000']
        : ['10', '25', '50', '100'];

    // Dynamic formatting hooks for proper symbol spacing
    const sym = SYMBOLS[detectedCurrency] || detectedCurrency;
    const spc = sym.length > 1 ? ' ' : '';
    const formatMoney = (val: number) => `${sym}${spc}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const toDisplayMajor = (minorAmountNgn: bigint) => {
        let majorNgn = Number(minorAmountNgn) / 100;
        if (detectedCurrency !== 'NGN' && fxRates && fxRates[detectedCurrency]) {
            return majorNgn * fxRates[detectedCurrency];
        }
        return majorNgn;
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatDecimalInput(e.target.value);
        const rawNum = Number(parseDecimalNumber(formatted));

        if (rawNum > remainingSelectedMajor) {
            toast.error(`Capped at current allocation limit: ${sym}${spc}${remainingSelectedMajor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            setDisplayAmount(formatDecimalInput(remainingSelectedMajor.toFixed(2)));
        } else {
            setDisplayAmount(formatted);
        }
    };

    const setQuickAmount = (val: string) => {
        const rawNum = Number(val);
        if (rawNum > remainingSelectedMajor) {
            toast.error(`Capped at current allocation limit: ${sym}${spc}${remainingSelectedMajor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
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
            const payload: any = {
                projectId: project.id,
                amount: baseAmountMinor.toString(),
                tipAmount: tipAmountMinor.toString(),
                gatewayFeeAmount: gatewayFeeMinor.toString(),
                currency: project.currency,
                donorCurrency: finalDonorCurrency,
                donorAmount: finalDonorAmount,
                fxRate: finalFxRate
            };

            if (isGuest) {
                payload.guestEmail = guestEmail.toLowerCase().trim();
                payload.guestName = 'Guest Supporter';
            }

            const data = await ApiService.donations.direct(payload);
            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl;
            }
        } catch (error) {
            setIsLoading(false);
        }
    };

    if (isPhaseFull) {
        return (
            <div className="bg-card border border-border/40 rounded-3xl p-6 md:p-10 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="h-20 w-20 bg-emerald-500/10 text-emerald-600 rounded-[28px] flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-3">
                    <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{currentStageDisplayName} fully funded!</h3>
                    <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
                        Thanks to our incredible donors, the funds for this stage have been secured.
                        Donations are currently paused while vendor execution is verified.
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
                        We are currently raising funds for <span className="text-primary font-black">{currentStageDisplayName}</span>. This stage is funded one allocation at a time.
                    </p>
                </div>

                <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-bold text-muted-foreground">Enter amount ({detectedCurrency})</label>
                        <span className="text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/20 shadow-sm flex items-center gap-1.5">
                            Allocation limit: {sym}{spc}{remainingSelectedMajor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="relative min-w-0">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 z-10 pointer-events-none font-black text-muted-foreground text-xl md:text-3xl whitespace-pre">
                            {sym}
                        </span>
                        <Input
                            type="text"
                            inputMode="decimal"
                            maxLength={14}
                            placeholder="0.00"
                            className={cn(
                                "pr-4 h-14 md:h-16 text-xl md:text-3xl font-bold rounded-2xl border border-border bg-muted/30 focus:bg-background focus:border-primary/50 tabular-nums w-full transition-all overflow-x-auto",
                                sym.length > 1 ? "pl-[4.5rem]" : "pl-11"
                            )}
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
                            <button key={val} onClick={() => setQuickAmount(val)} disabled={isUnverified} className="bg-muted/40 hover:bg-primary hover:text-white border border-border/40 px-4 py-2 rounded-3xl transition-all font-bold text-xs disabled:opacity-50 shadow-sm whitespace-pre">
                                {sym}{spc}{Number(val).toLocaleString()}
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
                                        Givar operates on radical transparency. If you value our platform, please consider an optional support contribution to help us maintain our servers and payment gateways.
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
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-sm font-bold text-muted-foreground mt-1 whitespace-pre">
                                                    {sym}{spc}
                                                </span>
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="0.00"
                                                    className={cn(
                                                        "h-11 text-sm font-bold rounded-2xl bg-muted/30 border-border/40 focus:bg-background tabular-nums",
                                                        sym.length > 1 ? "pl-[3.5rem]" : "pl-10"
                                                    )}
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
                                    <span className="tabular-nums font-bold text-foreground whitespace-pre">
                                        {formatMoney(inputAmountNum)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                                    <span>Operational Support Fee ({feePercentage}%)</span>
                                    <span className="tabular-nums font-bold text-foreground whitespace-pre">
                                        {formatMoney(toDisplayMajor(feeAmountMinor))}
                                    </span>
                                </div>
                                {inputTipNum > 0 && (
                                    <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                                        <span>Optional Support Contribution</span>
                                        <span className="tabular-nums font-bold text-foreground whitespace-pre">
                                            {formatMoney(inputTipNum)}
                                        </span>
                                    </div>
                                )}
                                {gatewayFeeMinor > 0n && (
                                    <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                                        <span>Payment Gateway Fee</span>
                                        <span className="tabular-nums font-bold text-foreground whitespace-pre">
                                            {formatMoney(toDisplayMajor(gatewayFeeMinor))}
                                        </span>
                                    </div>
                                )}
                                <div className="pt-3 border-t border-border/40 flex justify-between items-center">
                                    <span className="text-sm font-bold text-foreground">Total checkout</span>
                                    <span className="text-sm font-black text-primary tabular-nums whitespace-pre">
                                        {formatMoney(toDisplayMajor(totalCheckoutMinor))}
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
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none h-4 w-4 text-muted-foreground" />
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
                    {displayAmount && (isCompletingPhase || isCompletingItem) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={cn(
                                "flex items-start gap-2.5 p-4 rounded-2xl border overflow-hidden shadow-sm",
                                isCompletingPhase ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700" : "bg-blue-500/10 border-blue-500/20 text-blue-700"
                            )}
                        >
                            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                            <div className="text-xs space-y-0.5">
                                <p className="font-bold">{isCompletingPhase ? 'Stage completion gift' : 'Allocation complete'}</p>
                                <p className="font-medium">
                                    {isCompletingPhase
                                        ? `This gift fully funds ${currentStageDisplayName}! The project will pause to verify vendor execution before opening the next stage.`
                                        : `This gift fully funds the allocation for "${activeItemName}". The next vendor allocation will unlock immediately.`
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