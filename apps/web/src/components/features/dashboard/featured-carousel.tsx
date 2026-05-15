'use client';

import React, { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { MapPin, ShieldCheck, Clock, Share2, Loader2, CheckCircle2, BellRing } from 'lucide-react';
import { Project } from '../../../types';
import { cn } from '../../../lib/utils/cn';
import { Button } from '../../ui/button';
import { ShareModal } from '../impact/share-modal';
import { ApiService } from '../../../services/api';
import { getCookie } from 'cookies-next';
import toast from 'react-hot-toast';

const SYMBOLS: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
    EUR: '€',
    CAD: 'C$',
};

const formatNoDecimals = (minorAmt: bigint) => (Number(minorAmt) / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });

export const FeaturedCarousel = memo(function FeaturedCarousel({ projects }: { projects: Project[] & { subcategoryName?: string }[] }) {
    const router = useRouter();
    const [index, setIndex] = useState(0);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [shareProject, setShareProject] = useState<Project | null>(null);
    const [waitlistLoadingId, setWaitlistLoadingId] = useState<string | null>(null);
    const [waitlistedIds, setWaitlistedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!projects || projects.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % projects.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [projects?.length]);

    if (!projects || projects.length === 0) return null;

    const current: any = projects[index];
    if (!current) return null;

    // --- AGGREGATED PHASED FUNDING MATH ---
    const timeline = Array.isArray(current.executionTimeline) ? current.executionTimeline : [];
    const budget = Array.isArray(current.budgetBreakdown) ? current.budgetBreakdown : [];
    const activeIndex = current.currentPhaseIndex || 0;

    const raised = BigInt(current.raisedAmount || '0');
    const target = BigInt(current.targetAmount || '0');
    const isCompleted = current.status === 'COMPLETED';
    const isFundedState = current.status === 'FUNDED' || (raised >= target && target > 0n && !isCompleted);

    let previousPhasesMajor = 0;
    let currentPhaseMajor = 0;

    const previousStages = timeline.slice(0, activeIndex).map((t: any) => t.phase);
    const currentStageLogicName = timeline[activeIndex]?.phase || 'Main Stage';

    const currentStageDisplayName = timeline[activeIndex]
        ? `${timeline[activeIndex].phase}: ${timeline[activeIndex].deliverables}`
        : 'Main Stage';

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
        phaseCapMinor = target;
    }

    const currentPhaseTargetMinor = phaseCapMinor - previousPhasesMinor;
    let raisedInCurrentPhase = raised - previousPhasesMinor;
    if (raisedInCurrentPhase < 0n) raisedInCurrentPhase = 0n;

    const phasePercent = currentPhaseTargetMinor > 0n
        ? Math.min(100, Math.floor(Number(raisedInCurrentPhase * 100n / currentPhaseTargetMinor)))
        : 0;

    const remainingForPhaseMinor = currentPhaseTargetMinor > raisedInCurrentPhase ? currentPhaseTargetMinor - raisedInCurrentPhase : 0n;
    const isPhaseFull = remainingForPhaseMinor < 10000n && currentPhaseTargetMinor > 0n && !isFundedState && !isCompleted;

    const currencySymbol = SYMBOLS[current.currency] || current.currency;

    const handleDragEnd = (event: any, info: PanInfo) => {
        const swipeThreshold = 50;
        if (info.offset.x < -swipeThreshold) {
            setIndex((prev) => (prev + 1) % projects.length);
        } else if (info.offset.x > swipeThreshold) {
            setIndex((prev) => (prev - 1 + projects.length) % projects.length);
        }
    };

    const handleCardClick = () => {
        router.push(`/dashboard/impact/${current.slug}`);
    };

    const handleJoinWaitlist = async (projectId: string) => {
        const userCookie = getCookie('givar_user');
        let email = '';
        if (userCookie) {
            try {
                email = JSON.parse(userCookie as string).email;
            } catch (e) { }
        }

        if (!email) {
            toast.error("Please log in to join the waitlist");
            return;
        }

        setWaitlistLoadingId(projectId);
        try {
            await ApiService.projects.joinWaitlist(projectId, email);
            toast.success("You'll be notified when the next stage unlocks!");
            setWaitlistedIds(prev => new Set(prev).add(projectId));
        } catch (e) {
            toast.error("Could not join waitlist");
        } finally {
            setWaitlistLoadingId(null);
        }
    };

    const donateLink = `/dashboard/impact/${current.slug}/donate`;
    const detailsLink = `/dashboard/impact/${current.slug}`;

    return (
        <div className="relative w-full rounded-3xl overflow-hidden bg-card border border-border/40 shadow-sm transition-all duration-300">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    className="flex flex-col lg:grid lg:grid-cols-2 w-full lg:h-[220px] cursor-pointer touch-pan-y group"
                    onClick={handleCardClick}
                >
                    <div className="relative flex flex-col h-[140px] sm:h-[160px] lg:h-full group/col">
                        <div className="absolute inset-0 overflow-hidden bg-muted">
                            {current.imageUrl && (
                                <Image
                                    src={current.imageUrl}
                                    alt={current.title}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    priority
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />
                        </div>

                        <div className="absolute top-3 left-3 flex gap-2">
                            <div className="bg-primary text-primary-foreground rounded-3xl px-2 py-0.5 text-[11px] font-bold shadow-sm">
                                Featured
                            </div>
                            <div className="bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-3xl px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3 text-primary" />
                                <span>Verified</span>
                            </div>
                        </div>

                        <div className="relative mt-auto p-4 lg:p-5 space-y-0.5">
                            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight leading-tight line-clamp-1">
                                {current.title}
                            </h2>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-300">
                                <span className="flex items-center gap-1 font-medium">
                                    <MapPin className="h-2.5 w-2.5 text-primary" /> {current.location || 'Global Location'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col h-full p-3 sm:p-4 lg:p-5 bg-muted/10 border-t lg:border-t-0 lg:border-l border-border/40 min-w-0">
                        <div className="flex items-center justify-center mb-2 w-full">
                            <span className="text-[9px] lg:text-[10px] font-bold text-muted-foreground tracking-widest uppercase truncate text-center">Current Funding Stage</span>
                        </div>

                        <div className="bg-card border border-border/40 rounded-2xl p-3 lg:p-3.5 shadow-sm text-left flex flex-col justify-center min-w-0 mb-3">
                            <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-primary leading-tight truncate">
                                        {currentStageDisplayName}
                                    </h4>

                                    {!isPhaseFull && (
                                        <p className="text-[10px] text-muted-foreground leading-snug mt-1">
                                            This cause is funded in stages. Each stage unlocks only after the previous one is fully verified.
                                        </p>
                                    )}
                                </div>

                                {isPhaseFull && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-2xl border border-amber-200/60 shrink-0 whitespace-nowrap">
                                        <Clock className="h-3.5 w-3.5" /> Verifying Stage
                                    </div>
                                )}
                            </div>

                            {isPhaseFull ? (
                                <div className="space-y-1.5 animate-in fade-in">
                                    <p className="text-[11px] font-medium text-muted-foreground leading-snug line-clamp-2">
                                        Donations are paused while execution is verified.
                                    </p>
                                    <div className="h-1.5 w-full bg-primary/20 rounded-full overflow-hidden mt-1 lg:mt-2">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `100%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="h-full bg-primary rounded-full"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5 lg:space-y-2">
                                    <div className="flex justify-between items-end text-[10px] sm:text-[11px] font-bold">
                                        <span className="text-foreground truncate">
                                            {currencySymbol}{formatNoDecimals(raisedInCurrentPhase)} raised <span className="text-muted-foreground font-medium mx-0.5">of</span> {currencySymbol}{formatNoDecimals(currentPhaseTargetMinor)}
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
                        </div>

                        {/* CTA Actions */}
                        <div className="flex items-center gap-2 shrink-0 w-full mt-auto">
                            {(!isCompleted && !isFundedState && !isPhaseFull) ? (
                                <Link href={donateLink} className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                    <Button size="sm" className="w-full h-9 rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-xs shadow-md border-0 active:scale-95 truncate">
                                        Fund this impact
                                    </Button>
                                </Link>
                            ) : isPhaseFull ? (
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleJoinWaitlist(current.id);
                                    }}
                                    disabled={waitlistLoadingId === current.id || waitlistedIds.has(current.id)}
                                    className="flex-1 w-full h-9 rounded-full bg-muted/50 hover:bg-muted text-foreground border border-border/60 font-bold text-xs shadow-sm active:scale-95 transition-all truncate"
                                >
                                    {waitlistLoadingId === current.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                                    ) : waitlistedIds.has(current.id) ? (
                                        <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> On Waitlist</>
                                    ) : (
                                        <><BellRing className="h-3.5 w-3.5 mr-1.5" /> Notify me when unlocked</>
                                    )}
                                </Button>
                            ) : (
                                <Link href={detailsLink} className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                    <Button size="sm" variant="secondary" className="w-full h-9 rounded-full font-bold text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-none transition-all active:scale-95 truncate">
                                        View final impact
                                    </Button>
                                </Link>
                            )}

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShareProject(current);
                                    setIsShareOpen(true);
                                }}
                                className="h-9 w-9 rounded-full border-border/60 text-foreground shrink-0 bg-background shadow-sm active:scale-95 transition-all"
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                projectTitle={shareProject?.title || ''}
                projectSlug={shareProject?.slug || ''}
            />
        </div>
    );
});