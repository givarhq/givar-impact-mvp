'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, MapPin, Target } from 'lucide-react';
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

    return (
        <div className="relative w-full aspect-video md:aspect-[3/1] rounded-[32px] overflow-hidden bg-zinc-900 group">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0"
                >
                    <img
                        src={current.imageUrl}
                        className="w-full h-full object-cover opacity-60 scale-105"
                        alt={current.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                    <div className="absolute inset-0 p-6 sm:p-8 md:p-12 flex flex-col justify-end">
                        <div className="max-w-2xl space-y-3 md:space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Featured Cause</span>
                            </div>

                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight line-clamp-2">
                                {current.title}
                            </h2>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-300 text-xs font-medium">
                                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {current.location}</span>
                                <span className="flex items-center gap-1.5">
                                    <Target className="h-3.5 w-3.5" /> Goal:
                                    <SmartCurrency amount={current.targetAmount} currency={current.currency} visible={true} size="small" />
                                </span>
                            </div>

                            <div className="pt-2 md:pt-4 flex items-center gap-3">
                                <Link href={`/dashboard/impact/${current.slug}/donate`}>
                                    <Button className="rounded-xl h-11 px-6 font-bold shadow-xl shadow-primary/20">
                                        Donate Now
                                    </Button>
                                </Link>
                                <Link href={`/dashboard/impact/${current.slug}`}>
                                    <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl h-11 gap-2">
                                        View Details <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Controls */}
            {projects.length > 1 && (
                <>
                    <button
                        onClick={() => setIndex((prev) => (prev - 1 + projects.length) % projects.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/10 items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hidden md:flex"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={() => setIndex((prev) => (prev + 1) % projects.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/10 items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20 hidden md:flex"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>

                    <div className="absolute bottom-4 sm:bottom-6 right-6 sm:right-8 flex gap-1.5">
                        {projects.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1 rounded-full transition-all duration-500",
                                    i === index ? "w-6 sm:w-8 bg-primary" : "w-2 bg-white/20"
                                )}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}