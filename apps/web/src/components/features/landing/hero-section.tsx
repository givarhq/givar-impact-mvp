'use client';

import React, { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, Wallet, Activity, Heart, ExternalLink } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { SmartCurrency } from '../../ui/smart-currency';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectCard } from '../impact/project-card';
import { ShareModal } from '../impact/share-modal';
import { Project } from '../../../types';
import { cn } from 'apps/web/src/lib/utils/cn';

interface PlatformStats {
    totalVolume: string;
    latestDonations: Array<{
        projectTitle: string;
        amount: string;
        raised: string;
        target: string;
        createdAt: string;
    }>;
}

interface HeroSectionProps {
    featuredProjects: Project[];
    stats: PlatformStats;
}

export const HeroSection = memo(function HeroSection({ featuredProjects, stats }: HeroSectionProps) {
    const displayProjects = featuredProjects.slice(0, 3);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [shareProject, setShareProject] = useState<Project | null>(null);

    const donations = stats.latestDonations || [];
    const [donationIndex, setDonationIndex] = useState(0);

    useEffect(() => {
        if (donations.length <= 1) return;
        const interval = setInterval(() => {
            setDonationIndex((prev) => (prev + 1) % donations.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [donations.length]);

    const activeDonation = donations[donationIndex];
    const progressPercent = activeDonation
        ? Math.min(100, Math.round((Number(activeDonation.raised) / Number(activeDonation.target)) * 100))
        : 0;

    return (
        <div className="w-full flex flex-col items-center">

            {/* HERO SECTION */}
            <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 pt-32 md:pt-10 pb-12 md:pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">

                    {/* Left Copy */}
                    <div className="flex flex-col space-y-8 z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-8"
                        >
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-emerald-950 dark:text-white leading-[1.1] md:leading-[1.05]">
                                Give With <br />
                                <span className="text-primary">Confidence</span>
                            </h1>

                            <div className="space-y-6 max-w-lg">
                                <p className="text-lg sm:text-xl text-muted-foreground font-medium leading-relaxed tracking-tight">
                                    Ever wanted to give, but weren't sure where your money would go?
                                </p>

                                <div className="space-y-2">
                                    <p className="text-md font-bold text-primary tracking-[0.02em]">
                                        With Givar, every donation is
                                    </p>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                                        {['Traceable', 'Transparent', 'Impactful'].map((text) => (
                                            <div key={text} className="flex items-center gap-2.5 group">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner transition-transform group-hover:scale-110">
                                                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                                </div>
                                                <span className="text-sm sm:text-base font-bold text-emerald-950 dark:text-emerald-50 tracking-tight">{text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                                <Link href="/explore">
                                    <Button className="w-auto h-12 sm:h-14 px-8 rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-sm sm:text-base shadow-lg shadow-primary/20 transition-all active:scale-95 border-0">
                                        Explore Causes <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                                    </Button>
                                </Link>

                                <Link href="/signup" className="hidden sm:block">
                                    <Button
                                        variant="outline"
                                        className="w-auto h-12 sm:h-14 px-8 rounded-full bg-white dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 text-foreground hover:bg-muted font-bold text-sm sm:text-base border-border/60 shadow-sm transition-all active:scale-95"
                                    >
                                        Create Account
                                    </Button>
                                </Link>

                                <Link href="/login" className="sm:hidden">
                                    <Button
                                        variant="outline"
                                        className="w-auto h-12 sm:h-14 px-8 rounded-full bg-white dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 text-foreground hover:bg-muted font-bold text-sm sm:text-base border-border/60 shadow-sm transition-all active:scale-95"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Image Asset */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="relative w-full aspect-square lg:aspect-auto lg:h-[600px] flex items-center justify-center -mt-8 lg:mt-0"
                    >
                        <Image
                            src="/Land.jpg"
                            alt="Givar Impact Visualization"
                            fill
                            priority
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-contain mix-blend-multiply dark:mix-blend-normal dark:opacity-100"
                        />
                    </motion.div>
                </div>

                {/* Mobile Specific Data Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="lg:hidden w-full pt-8"
                >
                    <Link href="/records" title="View Public Ledger" className="block outline-none">
                        <Card className="group w-full border-white/80 dark:border-white/20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-5 text-emerald-950 dark:text-white shadow-xl rounded-3xl transition-all cursor-pointer active:scale-[0.98]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-emerald-900/60 dark:text-white/60 font-bold">Real-Time Volume</p>
                                        <div className="text-lg font-black font-mono truncate">
                                            <SmartCurrency
                                                amount={stats.totalVolume}
                                                currency="NGN"
                                                visible={true}
                                                size="default"
                                                className="text-emerald-950 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-emerald-900/40 dark:text-white/40 group-hover:text-primary transition-colors" />
                            </div>

                            <div className="h-[44px] relative overflow-hidden">
                                <AnimatePresence mode="wait">
                                    {activeDonation ? (
                                        <motion.div
                                            key={donationIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.4 }}
                                            className="space-y-2"
                                        >
                                            <div className="flex justify-between items-center text-[11px] font-bold">
                                                <span className="text-emerald-900/60 dark:text-white/60 truncate flex-1 mr-4">{activeDonation.projectTitle}</span>
                                                <span className="text-primary font-mono shrink-0">
                                                    + <SmartCurrency
                                                        amount={activeDonation.amount}
                                                        currency="NGN"
                                                        visible={true}
                                                        className="text-primary"
                                                    />
                                                </span>
                                            </div>
                                            <div className="h-1 w-full bg-emerald-900/10 dark:bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPercent}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-primary"
                                                />
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="text-xs text-emerald-900/40 dark:text-white/40 font-bold italic">Waiting for first donation...</div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </Card>
                    </Link>
                </motion.div>

                {/* Desktop Floating Glass Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="absolute right-6 bottom-10 hidden lg:block z-20"
                >
                    <Link href="/records" title="View Public Ledger" className="block outline-none">
                        <Card className="group w-80 border-white/80 dark:border-white/20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-5 text-emerald-950 dark:text-white shadow-2xl rounded-3xl transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-emerald-900/60 dark:text-white/60 font-bold">Real-Time Volume</p>
                                        <div className="text-lg font-black font-mono">
                                            <SmartCurrency
                                                amount={stats.totalVolume}
                                                currency="NGN"
                                                visible={true}
                                                size="default"
                                                className="text-emerald-950 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-emerald-900/40 dark:text-white/40 group-hover:text-primary transition-colors" />
                            </div>

                            <div className="h-[44px] relative overflow-hidden">
                                <AnimatePresence mode="wait">
                                    {activeDonation ? (
                                        <motion.div
                                            key={donationIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.4 }}
                                            className="space-y-2"
                                        >
                                            <div className="flex justify-between items-center text-xs font-bold">
                                                <span className="text-emerald-900/60 dark:text-white/60 truncate flex-1 mr-4">{activeDonation.projectTitle}</span>
                                                <span className="text-primary font-mono shrink-0">
                                                    + <SmartCurrency
                                                        amount={activeDonation.amount}
                                                        currency="NGN"
                                                        visible={true}
                                                        className="text-primary"
                                                    />
                                                </span>
                                            </div>
                                            <div className="h-1 w-full bg-emerald-900/10 dark:bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPercent}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-primary"
                                                />
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="text-xs text-emerald-900/40 dark:text-white/40 font-bold italic">Waiting for first donation...</div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex justify-between text-xs text-emerald-900/40 dark:text-white/40 font-bold pt-1">
                                <span>Just now</span>
                                <span>Verified on-chain</span>
                            </div>
                        </Card>
                    </Link>
                </motion.div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="w-full max-w-6xl mx-auto px-6 py-6 scroll-mt-28">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">See Real-Time Impact</h2>
                    <p className="text-muted-foreground font-medium mt-4 max-w-xl mx-auto">Follow your donation from the moment it leaves your wallet to the exact moment it changes a life.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
                    <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0" />

                    {/* Step 1 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative z-10 bg-white dark:bg-zinc-900 rounded-[32px] p-5 border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col group"
                    >
                        <div className="absolute -top-3 -left-3 h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-base shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">1</div>
                        <div className="h-12 w-12 bg-primary/5 dark:bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/10">
                            <Wallet className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">You Contribute</h3>
                        <p className="text-xs text-muted-foreground font-medium mb-4 leading-relaxed flex-1">Support a verified community cause instantly through your dedicated smart wallet.</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 dark:bg-zinc-800 rounded-xl border border-border/60 dark:border-white/10 text-[10px] font-bold text-foreground w-fit">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Capital Deployed
                        </div>
                    </motion.div>

                    {/* Step 2 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="relative z-10 bg-white dark:bg-zinc-900 rounded-[32px] p-5 border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col group"
                    >
                        <div className="absolute -top-3 -left-3 h-10 w-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center font-black text-base shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110">2</div>
                        <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-900/20">
                            <Activity className="h-6 w-6 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">Impact Happens</h3>
                        <p className="text-xs text-muted-foreground font-medium mb-4 leading-relaxed flex-1">Treasury funds are released directly to verified vendors to execute the mission.</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20 text-[10px] font-bold text-blue-700 dark:text-blue-400 w-fit">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Milestone Achieved
                        </div>
                    </motion.div>

                    {/* Step 3 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10 bg-white dark:bg-zinc-900 rounded-[32px] p-5 border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col group"
                    >
                        <div className="absolute -top-3 -left-3 h-10 w-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-base shadow-lg shadow-amber-500/20 transition-transform group-hover:scale-110">3</div>
                        <div className="h-12 w-12 bg-amber-50 dark:bg-amber-900/10 rounded-2xl flex items-center justify-center mb-4 border border-amber-100 dark:border-amber-900/20">
                            <Heart className="h-6 w-6 text-amber-500 fill-current" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">You Get Proof</h3>
                        <p className="text-xs text-muted-foreground font-medium mb-4 leading-relaxed flex-1">Photographic evidence and project receipts are uploaded to the public records.</p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-border/10 dark:border-emerald-900/20 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 w-fit">
                            <ShieldCheck className="h-3 w-3" /> Ledger Verified
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FEATURED CAUSES */}
            <section className="w-full max-w-6xl mx-auto px-6 py-20 border-t border-border/40">
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Featured Causes</h2>
                    <Link
                        href="/explore"
                        className="flex items-center text-sm font-bold text-primary hover:underline underline-offset-4 hidden sm:flex"
                    >
                        <span>View all causes</span>
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </div>

                {displayProjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayProjects.map((project, index) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <ProjectCard
                                    project={project as any}
                                    onDonate={() => { }}
                                    onShare={(p) => {
                                        setShareProject(p as Project);
                                        setIsShareOpen(true);
                                    }}
                                    isPublic={true}
                                />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="p-16 text-center bg-white dark:bg-zinc-900 rounded-[32px] border border-border/40 shadow-sm">
                        <Activity className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="font-bold text-muted-foreground text-sm">Discovering platform causes...</p>
                    </div>
                )}

                <div className="mt-10 flex justify-center sm:hidden">
                    <Link href="/explore">
                        <Button variant="outline" className="w-auto h-12 rounded-3xl font-bold border-border/60 dark:border-white/10 dark:bg-zinc-900 px-8 transition-all active:scale-95">
                            View all causes <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* TRUST SECTION */}
            <section className="w-full max-w-5xl mx-auto px-6 py-20 border-t border-border/40 text-center">
                <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-12">
                    Why People <span className="text-primary">Trust</span> Givar
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { icon: ShieldCheck, title: 'Verified Causes', desc: 'Every campaign vetted', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                        { icon: Wallet, title: 'Direct Payments', desc: 'No middlemen', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                        { icon: Activity, title: 'Transparent Tracking', desc: 'See every update', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                        { icon: Heart, title: 'Real Impact', desc: 'Proof delivered', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/10' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 bg-white dark:bg-zinc-900 rounded-full pl-3 pr-6 py-3 shadow-sm border border-border/60 dark:border-white/10 w-full">
                            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", item.bg, item.color)}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                                <p className="text-[11px] text-muted-foreground font-medium">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap justify-center items-center gap-3 text-xs font-bold text-muted-foreground">
                    <span>Fast Setup</span>
                    <span>•</span>
                    <span>Secure Access</span>
                    <span>•</span>
                    <span>Transparent by Design</span>
                </div>
            </section>

            {/* Share Modal Integration */}
            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                projectTitle={shareProject?.title || ''}
                projectSlug={shareProject?.slug || ''}
            />
        </div>
    );
});