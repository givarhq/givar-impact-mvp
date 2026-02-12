'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MapPin, ShieldCheck, Grid } from 'lucide-react';
import { Project } from '../../../types';
import { Button } from '../../ui/button';
import { SmartCurrency } from '../../ui/smart-currency';
import { cn } from '../../../lib/utils/cn';

export function FeaturedCarousel({ projects }: { projects: Project[] }) {
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

    return (
        <div className="relative w-full rounded-3xl overflow-hidden bg-card border border-border/40 shadow-sm transition-all duration-300">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col lg:grid lg:grid-cols-2 w-full lg:h-[220px]"
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
                            <p className="text-xs text-zinc-300 leading-relaxed line-clamp-1 max-w-md font-medium">
                                {current.shortDesc || current.description}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                                <span className="flex items-center gap-1 font-medium">
                                    <MapPin className="h-2.5 w-2.5 text-primary" /> {current.location}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Ledger & Actions */}
                    <div className="flex flex-col justify-center p-4 lg:p-6 bg-muted/10 border-t lg:border-t-0 lg:border-l border-border/40">
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <div className="space-y-0.5">
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Progress</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <SmartCurrency amount={current.raisedAmount} currency={current.currency} visible={true} size="default" className="text-foreground" />
                                        <span className="text-xs font-bold text-primary">{percent.toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Goal</p>
                                    <SmartCurrency amount={current.targetAmount} currency={current.currency} visible={true} size="small" className="text-foreground/50" />
                                </div>
                            </div>

                            <div className="h-1 w-full bg-muted rounded-3xl overflow-hidden border border-border/40">
                                <div
                                    className="h-full bg-primary rounded-3xl transition-all duration-1000 ease-out shadow-sm"
                                    style={{ width: `${percent}%` }}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <Link href={`/dashboard/impact/${current.slug}/donate`} className="w-full">
                                        <Button className="w-full h-8 rounded-3xl font-bold text-[11px] uppercase tracking-wider shadow-sm">
                                            Donate
                                        </Button>
                                    </Link>
                                    <Link href={`/dashboard/impact/${current.slug}`} className="w-full">
                                        <Button variant="outline" className="w-full h-8 rounded-3xl font-bold text-[11px] uppercase tracking-wider bg-background border-border/60">
                                            Details
                                        </Button>
                                    </Link>
                                </div>

                                <Link href="/dashboard/impact" className="flex items-center justify-center">
                                    <Button variant="ghost" className="h-7 text-xs font-bold text-muted-foreground hover:text-primary gap-1.5 transition-all">
                                        View all causes <ArrowRight className="h-3 w-3" />
                                    </Button>
                                </Link>
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
                            onClick={() => setIndex(i)}
                            className={cn(
                                "h-1 rounded-3xl transition-all duration-300",
                                i === index ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                            )}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}