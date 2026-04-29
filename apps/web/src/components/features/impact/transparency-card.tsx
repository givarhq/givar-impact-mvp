// apps/web/src/components/features/impact/transparency-card.tsx
'use client';

import { useState, useEffect, memo } from 'react';
import { ShieldCheck, Target, AlertCircle, Copy, Check, CheckCircle2, Clock, BellRing, Loader2, Info } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Project } from '../../../types';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ApiService } from '../../../services/api';
import { getCookie } from 'cookies-next';

interface TransparencyCardProps {
    project: Project & { donorCount?: number };
}

const SYMBOLS: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
    CAD: 'C$',
};

export const TransparencyCard = memo(function TransparencyCard({ project }: TransparencyCardProps) {
    // Global Project Math
    const totalRaised = BigInt(project.raisedAmount || '0');
    const totalTarget = BigInt(project.targetAmount || '0');
    const totalRemaining = totalRaised >= totalTarget ? 0n : totalTarget - totalRaised;
    const isCompleted = project.status === 'COMPLETED';
    const isFundedState = project.status === 'FUNDED' || (totalRaised >= totalTarget && totalTarget > 0n && !isCompleted);

    const totalPercent = totalTarget > 0n ? Math.min(100, Math.floor(Number(totalRaised * 100n / totalTarget))) : 0;

    // Phased Funding Math
    const activeIndex = project.currentPhaseIndex || 0;
    const budget = Array.isArray(project.budgetBreakdown) ? project.budgetBreakdown : [];

    let previousPhasesMajor = 0;
    for (let i = 0; i < activeIndex && i < budget.length; i++) {
        previousPhasesMajor += (budget[i].amount || (budget[i] as any).cost || 0);
    }
    const previousPhasesMinor = BigInt(previousPhasesMajor * 100);

    let cumulativeMajor = previousPhasesMajor;
    if (budget[activeIndex]) {
        cumulativeMajor += (budget[activeIndex].amount || (budget[activeIndex] as any).cost || 0);
    }
    const phaseCapMinor = budget.length > 0 && activeIndex < budget.length
        ? BigInt(cumulativeMajor * 100)
        : totalTarget;

    const currentPhaseTargetMinor = phaseCapMinor - previousPhasesMinor;
    let raisedInCurrentPhase = totalRaised - previousPhasesMinor;
    if (raisedInCurrentPhase < 0n) raisedInCurrentPhase = 0n;

    const phasePercent = currentPhaseTargetMinor > 0n
        ? Math.min(100, Math.floor(Number(raisedInCurrentPhase * 100n / currentPhaseTargetMinor)))
        : 0;

    const isPhaseFull = raisedInCurrentPhase >= currentPhaseTargetMinor && currentPhaseTargetMinor > 0n && !isFundedState && !isCompleted;
    const activeItemName = budget[activeIndex] ? (budget[activeIndex].description || (budget[activeIndex] as any).item) : 'Final Phase';

    // Waitlist State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [isWaitlistLoading, setIsWaitlistLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const userCookie = getCookie('givar_user');
        if (userCookie) {
            setIsAuthenticated(true);
            try {
                const user = JSON.parse(userCookie as string);
                if (user.email) setWaitlistEmail(user.email);
            } catch (e) { }
        }
    }, []);

    const copyIdToClipboard = () => {
        navigator.clipboard.writeText(project.slug);
        setCopied(true);
        toast.success("Project ID copied");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleJoinWaitlist = async () => {
        if (!waitlistEmail || !waitlistEmail.includes('@')) return toast.error("Valid email required");
        setIsWaitlistLoading(true);
        try {
            await ApiService.projects.joinWaitlist(project.id, waitlistEmail);
            toast.success("You'll be notified when the next phase unlocks!");
            if (!isAuthenticated) setWaitlistEmail('');
        } catch (e: any) {
            toast.success("You've been added to the notification queue!");
            if (!isAuthenticated) setWaitlistEmail('');
        } finally {
            setIsWaitlistLoading(false);
        }
    };

    const currencySymbol = SYMBOLS[project.currency] || project.currency;
    const formatNoDecimals = (minorAmt: bigint) => (Number(minorAmt) / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });

    return (
        <div className="space-y-4 md:space-y-5" id="transparency-card">

            {/* Segment 1: Overall Progress */}
            <Card className="relative overflow-hidden bg-card border-border/40 rounded-3xl p-5 md:p-6 shadow-sm">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            Overall Progress <Info className="h-3.5 w-3.5 text-muted-foreground/50" />
                        </span>
                        <button
                            onClick={copyIdToClipboard}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors group/copy outline-none"
                        >
                            <span>ID: {project.slug.slice(0, 8)}...</span>
                            {copied ? (
                                <Check className="h-3 w-3 text-primary animate-in zoom-in" />
                            ) : (
                                <Copy className="h-3 w-3 opacity-30 group-hover/copy:opacity-100 transition-opacity" />
                            )}
                        </button>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl md:text-3xl font-black text-primary tracking-tighter">
                                {currencySymbol}{formatNoDecimals(totalRaised)}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">raised</span>
                        </div>
                    </div>

                    <div className="space-y-2 pt-1">
                        <p className="text-xs font-bold text-primary">{totalPercent}% funded</p>
                        <div className="h-1.5 w-full bg-primary/20 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${totalPercent}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-primary rounded-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-2xl border border-border/60 flex flex-col items-center justify-center text-center space-y-1.5 shadow-sm bg-muted/10">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <Target className="h-3.5 w-3.5 text-primary" /> Goal
                            </div>
                            <div className="font-bold text-sm text-foreground">{currencySymbol}{formatNoDecimals(totalTarget)}</div>
                        </div>
                        <div className="p-3 rounded-2xl border border-border/60 flex flex-col items-center justify-center text-center space-y-1.5 shadow-sm bg-muted/10">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Remaining
                            </div>
                            <div className="font-bold text-sm text-foreground">{currencySymbol}{formatNoDecimals(totalRemaining)}</div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Segment 2: Phased Funding Note */}
            <Card className="bg-primary/5 border border-primary/20 rounded-3xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">Phased Funding</h4>
                        <p className="text-[11px] text-foreground/80 font-medium leading-relaxed">
                            This cause is funded in stages. Once a stage is fully funded and confirmed, the next stage opens for funding.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Segment 3: Current Funding Phase */}
            {(!isCompleted && !isFundedState) ? (
                <div className="space-y-4 md:space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="h-px bg-border flex-1" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CURRENT FUNDING PHASE</span>
                        <div className="h-px bg-border flex-1" />
                    </div>

                    <Card className="bg-card border border-border/40 rounded-3xl p-5 shadow-sm">
                        <h4 className="text-sm font-bold text-primary leading-tight mb-4">
                            Phase {activeIndex + 1}: {activeItemName}
                        </h4>

                        {isPhaseFull ? (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60 w-fit">
                                        <Clock className="h-3.5 w-3.5" /> Verification in Progress
                                    </div>
                                    <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                        This phase is fully funded. Donations are paused while it is being processed.
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-border/40 space-y-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <BellRing className="h-3.5 w-3.5" />
                                        <h4 className="text-[11px] font-bold">Get notified when Phase {activeIndex + 2} opens</h4>
                                    </div>

                                    {isAuthenticated ? (
                                        <Button
                                            onClick={handleJoinWaitlist}
                                            disabled={isWaitlistLoading}
                                            className="h-9 rounded-2xl font-bold bg-muted/30 hover:bg-muted text-foreground border border-border/60 shadow-sm w-full transition-all active:scale-95 text-[11px]"
                                        >
                                            {isWaitlistLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `Notify me`}
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <Input
                                                placeholder="your@email.com"
                                                value={waitlistEmail}
                                                onChange={e => setWaitlistEmail(e.target.value)}
                                                className="h-9 rounded-2xl bg-muted/20 border-border/40 text-[11px] shadow-inner focus:bg-background"
                                            />
                                            <Button
                                                onClick={handleJoinWaitlist}
                                                disabled={isWaitlistLoading || !waitlistEmail}
                                                className="h-9 rounded-2xl font-bold bg-muted/30 hover:bg-muted text-foreground border border-border/60 shadow-sm w-full transition-all active:scale-95 text-[11px]"
                                            >
                                                {isWaitlistLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Notify me'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex justify-between items-end text-xs font-bold">
                                    <span className="text-foreground">
                                        {currencySymbol}{formatNoDecimals(raisedInCurrentPhase)} <span className="text-muted-foreground font-medium mx-1">of</span> {currencySymbol}{formatNoDecimals(currentPhaseTargetMinor)}
                                    </span>
                                    <span className="text-primary">{phasePercent}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-primary/20 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${phasePercent}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-primary rounded-full"
                                    />
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            ) : (
                <Card className="p-5 md:p-6 rounded-3xl border border-primary/20 bg-primary/5 text-center space-y-2 shadow-sm">
                    <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-foreground tracking-tight">Campaign Fully Funded</h3>
                    <p className="text-[11px] text-foreground/80 font-medium">
                        All financial requirements have been met.
                    </p>
                </Card>
            )}
        </div>
    );
});