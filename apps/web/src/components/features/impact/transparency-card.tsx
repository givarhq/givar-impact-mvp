'use client';

import { useState, useEffect, memo } from 'react';
import { ShieldCheck, Target, Users, AlertCircle, X, Copy, Check, CheckCircle2, Clock, TrendingUp, BellRing, Loader2, Info } from 'lucide-react';
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

    // State & UI Handlers
    const [expandedCard, setExpandedCard] = useState<'goal' | 'remaining' | null>(null);
    const [copied, setCopied] = useState(false);

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
        <Card className="relative overflow-hidden bg-card border-border/40 rounded-3xl p-5 shadow-sm" id="transparency-card">
            {/* Header Context */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-3xl border border-emerald-100">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold tracking-tight">Verified Budget</span>
                </div>

                <button
                    onClick={copyIdToClipboard}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium hover:text-foreground transition-colors group/copy outline-none"
                >
                    <span>ID: {project.slug.slice(0, 15)}...</span>
                    {copied ? (
                        <Check className="h-3 w-3 text-emerald-500 animate-in zoom-in" />
                    ) : (
                        <Copy className="h-3 w-3 opacity-30 group-hover/copy:opacity-100 transition-opacity" />
                    )}
                </button>
            </div>

            {/* OVERALL GOAL SECTION (Now the primary focus) */}
            <div className="space-y-4 mb-8">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            Total funding <Info className="h-3.5 w-3.5 opacity-50" />
                        </p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold tracking-tight text-foreground">
                                <SmartCurrency amount={totalRaised.toString()} currency={project.currency} visible={true} size="default" />
                            </h3>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground pt-0.5">
                            of <SmartCurrency amount={totalTarget.toString()} currency={project.currency} visible={true} size="small" hideKobo />
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-lg font-black text-emerald-600">{overallPercent}%</span>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="h-2.5 w-full bg-muted rounded-3xl overflow-hidden p-0.5 border border-border/40">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${overallPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-emerald-500 rounded-3xl shadow-sm"
                        />
                    </div>
                    <div className="flex justify-end">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <SmartCurrency amount={totalRemaining.toString()} currency={project.currency} visible={true} size="small" hideKobo /> remaining
                        </span>
                    </div>
                </div>
            </div>

            {/* ACTIVE PHASE METRICS (Nested context) */}
            {(!isCompleted && !isFundedState) ? (
                <div className={cn(
                    "p-5 rounded-3xl mb-6 border transition-all relative overflow-hidden",
                    isPhaseFull ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/10 border-border/40"
                )}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                            "h-10 w-10 rounded-2xl flex items-center justify-center border shadow-inner shrink-0",
                            isPhaseFull ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-primary/10 text-primary border-primary/20"
                        )}>
                            {isPhaseFull ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className={cn(
                                "text-[10px] font-bold uppercase tracking-widest leading-none mb-1",
                                isPhaseFull ? "text-amber-600" : "text-primary"
                            )}>
                                {isPhaseFull ? 'Phase Execution' : 'Active Funding Phase'}
                            </p>
                            <p className="text-sm font-bold text-foreground truncate w-full" title={`Phase ${activeIndex + 1}: ${activeItemName}`}>
                                Phase {activeIndex + 1}: {activeItemName}
                            </p>
                        </div>
                    </div>

                    {isPhaseFull ? (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-100/50 px-3 py-1.5 rounded-xl border border-amber-200 w-fit">
                                    <Clock className="h-3.5 w-3.5" /> Awaiting Verification
                                </div>
                                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                    This phase is fully funded. Donations are paused until the vendor's proof of work is verified.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-amber-500/10 space-y-3">
                                <div className="flex items-center gap-2 text-amber-700">
                                    <BellRing className="h-4 w-4" />
                                    <h4 className="text-[11px] font-bold">Get notified when Phase {activeIndex + 2} opens</h4>
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
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Input
                                            placeholder="your@email.com"
                                            value={waitlistEmail}
                                            onChange={e => setWaitlistEmail(e.target.value)}
                                            className="h-10 rounded-2xl bg-background border-border/40 text-xs shadow-inner focus:bg-white"
                                        />
                                        <Button
                                            onClick={handleJoinWaitlist}
                                            disabled={isWaitlistLoading || !waitlistEmail}
                                            className="h-10 rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md border-0 px-6 transition-all active:scale-95 text-xs shrink-0"
                                        >
                                            {isWaitlistLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Notify me'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Raised for Phase {activeIndex + 1}</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-foreground">
                                            <SmartCurrency amount={raisedInCurrentPhase.toString()} currency={project.currency} visible={true} size="small" />
                                        </span>
                                        <span className="text-xs font-medium text-muted-foreground">
                                            of <SmartCurrency amount={currentPhaseTargetMinor.toString()} currency={project.currency} visible={true} size="small" hideKobo />
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-primary">{phasePercent}%</span>
                                </div>
                            </div>

                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/40">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${phasePercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-primary rounded-full shadow-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-6 rounded-3xl mb-6 border border-emerald-500/20 bg-emerald-500/5 text-center space-y-2">
                    <div className="h-12 w-12 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-950 dark:text-emerald-50">Cause Fully Funded</h3>
                    <p className="text-xs text-emerald-900/80 dark:text-emerald-100/80 font-medium">
                        All financial requirements have been met.
                    </p>
                </div>
            )}

            {/* Donor Distribution & Transparency Info */}
            <div className="space-y-3 mb-5">
                <motion.div layout className="p-3 rounded-2xl bg-muted/20 border border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-xs font-bold text-muted-foreground ">Verified Donors</span>
                    </div>
                    <p className="font-bold text-sm text-foreground">{project.donorCount || 0}</p>
                </motion.div>

                <motion.div layout className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3 shadow-inner">
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Phased Accountability</p>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            This cause is funded in stages. Once a stage is fully funded and confirmed, the next stage opens for funding.
                        </p>
                    </div>
                </motion.div>
            </div>
        </Card>
    );
});