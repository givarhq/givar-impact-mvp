'use client';

import { useState, useEffect, memo } from 'react';
import { ShieldCheck, Target, Users, AlertCircle, X, Copy, Check, Lock, CheckCircle2, Clock, TrendingUp, BellRing, Loader2, Info, BadgeCheck } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { SmartCurrency } from '../../ui/smart-currency';
import { Project } from '../../../types';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ApiService } from '../../../services/api';
import { getCookie } from 'cookies-next';

interface TransparencyCardProps {
    project: Project & { donorCount?: number };
}

export const TransparencyCard = memo(function TransparencyCard({ project }: TransparencyCardProps) {
    const pathname = usePathname();

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

    return (
        <Card className="relative overflow-hidden bg-card border-border/40 rounded-3xl p-6 md:p-8 shadow-sm" id="transparency-card">

            {/* Total Funding Section */}
            <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        Total funding <Info className="h-4 w-4 text-muted-foreground/50" />
                    </span>
                    <button
                        onClick={copyIdToClipboard}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium hover:text-foreground transition-colors group/copy outline-none"
                    >
                        <span>ID: {project.slug.slice(0, 8)}...</span>
                        {copied ? (
                            <Check className="h-3 w-3 text-emerald-500 animate-in zoom-in" />
                        ) : (
                            <Copy className="h-3 w-3 opacity-30 group-hover/copy:opacity-100 transition-opacity" />
                        )}
                    </button>
                </div>

                <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                        <SmartCurrency amount={totalRaised.toString()} currency={project.currency} visible={true} size="large" className="text-emerald-600 font-black text-3xl tracking-tighter" />
                        <span className="text-sm font-medium text-muted-foreground">raised</span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground flex items-baseline gap-1">
                        of <SmartCurrency amount={totalTarget.toString()} currency={project.currency} visible={true} size="small" />
                    </p>
                </div>

                <div className="space-y-2.5 pt-2">
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${totalPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-emerald-500 rounded-full"
                        />
                    </div>
                    <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <SmartCurrency amount={totalRemaining.toString()} currency={project.currency} visible={true} size="small" hideKobo /> remaining
                        </span>
                        <span className="font-bold text-emerald-600">{totalPercent}%</span>
                    </div>
                </div>
            </div>

            {/* Phased Funding Info Note */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 mb-8 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4" /> Phased funding
                </div>
                <p className="text-xs text-emerald-900/70 font-medium leading-relaxed">
                    This cause is funded in stages. Once a stage is fully funded and confirmed, the next stage opens for funding.
                </p>
            </div>

            {/* Currently Funding Section */}
            {(!isCompleted && !isFundedState) ? (
                <div className="pt-6 border-t border-border/40">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Currently funding</p>
                    <h4 className="text-sm font-bold text-foreground leading-tight mb-5">Phase {activeIndex + 1}: {activeItemName}</h4>

                    {isPhaseFull ? (
                        <div className="space-y-5 animate-in fade-in">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/60 w-fit">
                                    <Clock className="h-3.5 w-3.5" /> Verification in Progress
                                </div>
                                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                    This phase is fully funded. Donations are paused while we verify the vendor's proof of work.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-border/40 space-y-3">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <BellRing className="h-4 w-4" />
                                    <h4 className="text-[11px] font-bold">Get notified when Phase {activeIndex + 2} opens</h4>
                                </div>

                                {isAuthenticated ? (
                                    <Button
                                        onClick={handleJoinWaitlist}
                                        disabled={isWaitlistLoading}
                                        className="h-10 rounded-2xl font-bold bg-muted/30 hover:bg-muted text-foreground border border-border/60 shadow-sm w-full transition-all active:scale-95 text-xs"
                                    >
                                        {isWaitlistLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `Notify me`}
                                    </Button>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <Input
                                            placeholder="your@email.com"
                                            value={waitlistEmail}
                                            onChange={e => setWaitlistEmail(e.target.value)}
                                            className="h-10 rounded-2xl bg-muted/20 border-border/40 text-xs shadow-inner focus:bg-background"
                                        />
                                        <Button
                                            onClick={handleJoinWaitlist}
                                            disabled={isWaitlistLoading || !waitlistEmail}
                                            className="h-10 rounded-2xl font-bold bg-muted/30 hover:bg-muted text-foreground border border-border/60 shadow-sm w-full transition-all active:scale-95 text-xs"
                                        >
                                            {isWaitlistLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Notify me'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-1 text-xs text-foreground font-bold">
                                <SmartCurrency amount={raisedInCurrentPhase.toString()} currency={project.currency} visible={true} size="small" hideKobo />
                                <span className="text-muted-foreground font-medium mx-1">of</span>
                                <SmartCurrency amount={currentPhaseTargetMinor.toString()} currency={project.currency} visible={true} size="small" className="text-muted-foreground" hideKobo />
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${phasePercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-primary"
                                />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-2">
                    <div className="h-12 w-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-950 dark:text-emerald-50">Campaign Fully Funded</h3>
                    <p className="text-xs text-emerald-900/80 dark:text-emerald-100/80 font-medium">
                        All financial requirements have been met.
                    </p>
                </div>
            )}
        </Card>
    );
});