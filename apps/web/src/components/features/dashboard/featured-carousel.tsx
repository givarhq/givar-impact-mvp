'use client';

import React, { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { MapPin, ShieldCheck, Clock } from 'lucide-react';
import { Project } from '../../../types';
import { cn } from '../../../lib/utils/cn';

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

    // --- PHASED FUNDING MATH ---
    const raised = BigInt(current.raisedAmount || '0');
    const target = BigInt(current.targetAmount || '0');
    const isCompleted = current.status === 'COMPLETED';
    const isFundedState = current.status === 'FUNDED' || (raised >= target && target > 0n && !isCompleted);

    const activeIndex = current.currentPhaseIndex || 0;
    const budget = Array.isArray(current.budgetBreakdown) ? current.budgetBreakdown : [];

    let previousPhasesMajor = 0;
    for (let i = 0; i < activeIndex && i < budget.length; i++) {
        previousPhasesMajor += (budget[i].amount || (budget[i] as any).cost || 0);
    }
    const previousPhasesMinor = BigInt(Math.round(previousPhasesMajor * 100));

    let cumulativeMajor = previousPhasesMajor;
    if (budget[activeIndex]) {
        cumulativeMajor += (budget[activeIndex].amount || (budget[activeIndex] as any).cost || 0);
    }
    const phaseCapMinor = budget.length > 0 && activeIndex < budget.length
        ? BigInt(Math.round(cumulativeMajor * 100))
        : target;

    const currentPhaseTargetMinor = phaseCapMinor - previousPhasesMinor;
    let raisedInCurrentPhase = raised - previousPhasesMinor;
    if (raisedInCurrentPhase < 0n) raisedInCurrentPhase = 0n;

    const phasePercent = currentPhaseTargetMinor > 0n
        ? Math.min(100, Math.floor(Number(raisedInCurrentPhase * 100n / currentPhaseTargetMinor)))
        : 0;

    const remainingForPhaseMinor = currentPhaseTargetMinor > raisedInCurrentPhase ? currentPhaseTargetMinor - raisedInCurrentPhase : 0n;
    const isPhaseFull = remainingForPhaseMinor < 10000n && currentPhaseTargetMinor > 0n && !isFundedState && !isCompleted;

    const activeItemName = budget[activeIndex] ? (budget[activeIndex].description || (budget[activeIndex] as any).item) : 'Final Phase';
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

    const displayCategory = current.subcategoryName
        ? `${current.categoryName || current.category?.name} • ${current.subcategoryName}`
        : (current.categoryName || current.category?.name || 'Active cause');

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

                        <div className="relative mt-auto p-4 lg:p-6 space-y-0.5">
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

                    <div className="flex flex-col justify-center h-full p-3 sm:p-4 lg:p-6 bg-muted/10 border-t lg:border-t-0 lg:border-l border-border/40">
                        <div className="space-y-3 lg:space-y-4 w-full">
                            <div className="flex items-center justify-center">
                                <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Current Funding Phase</span>
                            </div>

                            <div className="bg-card border border-border/40 rounded-2xl p-3 lg:p-4 shadow-sm text-left">
                                <h4 className="text-xs font-bold text-primary leading-tight mb-2 lg:mb-3 truncate">
                                    Phase {activeIndex + 1}: {activeItemName}
                                </h4>

                                {isPhaseFull ? (
                                    <div className="space-y-2 lg:space-y-3 animate-in fade-in">
                                        <div className="flex items-center gap-2 text-[10px] lg:text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60 w-fit">
                                            <Clock className="h-3.5 w-3.5" /> Verification in Progress
                                        </div>
                                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                            This phase is fully funded. Donations are paused while it is processed.
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
                                        <div className="flex justify-between items-end text-[11px] font-bold">
                                            <span className="text-foreground">
                                                {currencySymbol}{formatNoDecimals(raisedInCurrentPhase)} raised <span className="text-muted-foreground font-medium mx-1">of</span> {currencySymbol}{formatNoDecimals(currentPhaseTargetMinor)}
                                            </span>
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
                        </div>

                        <div className="flex justify-center shrink-0 mt-3 sm:mt-4 lg:mt-0">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(isPhaseFull ? `/dashboard/impact/${current.slug}` : `/dashboard/impact/${current.slug}/donate`);
                                }}
                                className="w-full sm:w-32 h-10 rounded-3xl bg-primary text-white hover:bg-primary/90 font-bold text-sm shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 border-0 shrink-0"
                            >
                                {isPhaseFull ? "View cause" : "Fund this impact"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {projects.length > 1 && (
                <div className="absolute top-3 right-4 flex items-center gap-1.5 z-10">
                    {projects.map((_, i) => (
                        <button
                            key={i}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIndex(i);
                            }}
                            className={cn(
                                "h-1 rounded-3xl transition-all duration-500",
                                i === index ? "w-4 bg-primary" : "w-1.5 bg-white/30 hover:bg-white/50"
                            )}
                            aria-label={`Go To Slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});