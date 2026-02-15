'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ArrowRight, MapPin, ShieldCheck } from 'lucide-react';
import { Project } from '../../../types';
import { SmartCurrency } from '../../ui/smart-currency';
import { cn } from '../../../lib/utils/cn';

export function FeaturedCarousel({ projects }: { projects: Project[] }) {
    const router = useRouter();
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (projects.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % projects.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [projects.length]);

    if (projects.length === 0) return null;

    const current = projects[index];
    const raised = Number(current.raisedAmount || 0);
    const target = Number(current.targetAmount || 0);
    const percent = target > 0 ? Math.min(100, (raised / target) * 100) : 0;

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

    return (
        <div className="relative w-full rounded-3xl overflow-hidden bg-card border border-border/40 shadow-sm transition-all duration-300">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    className="flex flex-col lg:grid lg:grid-cols-2 w-full lg:h-[220px] cursor-pointer touch-pan-y"
                    onClick={handleCardClick}
                >
                    {/* Column 1: Graphics & Narrative */}
                    <div className="relative flex flex-col h-[160px] lg:h-full group/col">
                        <div className="absolute inset-0 overflow-hidden bg-muted">
                            <img
                                src={current.imageUrl}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/col:scale-105"
                                alt=""
                            />
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
                                    <MapPin className="h-2.5 w-2.5 text-primary" /> {current.location}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Ledger & Actions */}
                    <div className="flex flex-col justify-center p-4 lg:p-6 bg-muted/10 border-t lg:border-t-0 lg:border-l border-border/40 text-center">
                        <div className="space-y-4">
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-0.5 text-left">
                                        <p className="text-[10px] font-bold text-muted-foreground">Progress</p>
                                        <div className="flex items-baseline gap-1.5">
                                            <SmartCurrency amount={current.raisedAmount} currency={current.currency} visible={true} size="default" className="text-foreground" />
                                            <span className="text-xs font-bold text-primary">{percent.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-muted-foreground/60">Goal</p>
                                        <SmartCurrency amount={current.targetAmount} currency={current.currency} visible={true} size="small" className="text-foreground/50" />
                                    </div>
                                </div>

                                <div className="h-1 w-full bg-muted rounded-3xl overflow-hidden border border-border/40">
                                    <div
                                        className="h-full bg-primary rounded-3xl transition-all duration-1000 ease-out shadow-sm"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/dashboard/impact/${current.slug}/donate`);
                                    }}
                                    className="w-32 h-10 rounded-3xl bg-primary text-white hover:bg-primary/90 font-bold text-sm shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 border-0"
                                >
                                    Donate
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push('/dashboard/impact');
                                    }}
                                    className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-all group"
                                >
                                    View all verified causes
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Pagination Controls */}
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
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}