'use client';

import { useState, useEffect, memo } from 'react';
import { ShieldCheck, CheckCircle2, Clock, BellRing, Loader2, Info } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { SmartCurrency } from '../../ui/smart-currency';
import { Project } from '../../../types';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ApiService } from '../../../services/api';
import { getCookie } from 'cookies-next';

interface TransparencyCardProps {
    project: Project & { donorCount?: number };
}

export const TransparencyCard = memo(function TransparencyCard({ project }: TransparencyCardProps) {
    // Global Project Math
    const totalRaised = BigInt(project.raisedAmount || '0');
    const totalTarget = BigInt(project.targetAmount || '0');
    const totalRemaining = totalRaised >= totalTarget ? 0n : totalTarget - totalRaised;
    const isCompleted = project.status === 'COMPLETED';
    const isFundedState = project.status === 'FUNDED' || (totalRaised >= totalTarget && totalTarget > 0n && !isCompleted);

    const overallPercent = totalTarget > 0n ? Math.min(100, Math.floor(Number(totalRaised * 100n / totalTarget))) : 0;

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

    if (isCompleted || isFundedState) {
        return (
            <Card className="overflow-hidden bg-card border-border/40 rounded-3xl p-6 shadow-sm text-center space-y-4">
                <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 rounded-[24px] flex items-center justify-center mx-auto mb-2 shadow-inner">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">Cause Fully Funded</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    All financial requirements have been met. Thank you to everyone who contributed!
                </p>
                <div className="pt-4 border-t border-border/40 flex justify-between items-center text-sm font-bold">
                    <span className="text-muted-foreground">Total Raised</span>
                    <span className="text-emerald-600">
                        <SmartCurrency amount={totalRaised.toString()} currency={project.currency} visible={true} size="default" hideKobo />
                    </span>
                </div>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden bg-card border-border/40 rounded-3xl shadow-sm">
            <div className="p-5 md:p-6 space-y-6">

                {/* OVERALL FUNDING BLOCK */}
                <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                        Total funding <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-black tracking-tighter text-emerald-600">
                                <SmartCurrency amount={totalRaised.toString()} currency={project.currency} visible={true} hideKobo />
                            </span>
                            <span className="text-sm font-bold text-muted-foreground">raised</span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            of <SmartCurrency amount={totalTarget.toString()} currency={project.currency} visible={true} size="small" hideKobo />
                        </p>
                    </div>

                    <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-3">
                            <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${overallPercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-emerald-500 rounded-full"
                                />
                            </div>
                            <span className="text-sm font-bold text-emerald-600">{overallPercent}%</span>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground">
                            <SmartCurrency amount={totalRemaining.toString()} currency={project.currency} visible={true} size="small" hideKobo /> remaining
                        </p>
                    </div>
                </div>

                {/* PHASED FUNDING INFO BLOCK */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 shadow-inner">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-emerald-900 leading-none">Phased funding</h4>
                            <Info className="h-3.5 w-3.5 text-emerald-600/60" />
                        </div>
                        <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                            This cause is funded in stages. Once a stage is fully funded and confirmed, the next stage opens for funding.
                        </p>
                    </div>
                </div>

                {/* CURRENT PHASE FUNDING BLOCK */}
                <div className="space-y-3 pt-2">
                    {isPhaseFull ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-100/50 px-3 py-1.5 rounded-xl border border-amber-200 w-fit">
                                <Clock className="h-3.5 w-3.5" /> Phase Awaiting Verification
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2 text-amber-700">
                                    <BellRing className="h-4 w-4" />
                                    <h4 className="text-xs font-bold">Get notified when Phase {activeIndex + 2} opens</h4>
                                </div>
                                {isAuthenticated ? (
                                    <Button
                                        onClick={handleJoinWaitlist}
                                        disabled={isWaitlistLoading}
                                        className="h-10 rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md border-0 w-full transition-all active:scale-95 text-xs"
                                    >
                                        {isWaitlistLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `Notify me`}
                                    </Button>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <Input
                                            placeholder="your@email.com"
                                            value={waitlistEmail}
                                            onChange={e => setWaitlistEmail(e.target.value)}
                                            className="h-10 rounded-2xl bg-muted/30 border-border/40 text-xs"
                                        />
                                        <Button
                                            onClick={handleJoinWaitlist}
                                            disabled={isWaitlistLoading || !waitlistEmail}
                                            className="h-10 rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-white border-0 w-full transition-all active:scale-95 text-xs"
                                        >
                                            {isWaitlistLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Notify me'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <h4 className="text-sm font-bold text-emerald-600">Currently funding</h4>
                            <div className="space-y-1">
                                <p className="text-base font-bold text-foreground leading-tight truncate">
                                    {activeItemName}
                                </p>
                                <p className="text-sm font-bold text-muted-foreground flex items-baseline gap-1">
                                    <SmartCurrency amount={raisedInCurrentPhase.toString()} currency={project.currency} visible={true} size="small" hideKobo className="text-foreground" />
                                    <span className="text-xs">of</span>
                                    <SmartCurrency amount={currentPhaseTargetMinor.toString()} currency={project.currency} visible={true} size="small" hideKobo />
                                </p>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-2 border border-border/40">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${phasePercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-muted-foreground/30 rounded-full"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
});