'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, ShieldCheck, Activity, FileCheck, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { cn } from '../../../lib/utils/cn';

const steps = [
    {
        num: 1,
        title: "You Give",
        desc: "Support a verified cause instantly using your card, Apple Pay, or direct bank transfer.",
        badge: "Capital Deployed",
        img: "/howphone.png",
        icon: Wallet,
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        border: "border-emerald-100 dark:border-emerald-500/20",
        badgeBg: "bg-emerald-600"
    },
    {
        num: 2,
        title: "Phased Funding",
        desc: "To ensure accountability, causes are funded one item at a time. Your gift is allocated only to the specific, active phase of the implementation plan.",
        badge: "Smart Routing",
        img: "/howlap.png",
        icon: ShieldCheck,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-500/10",
        border: "border-blue-100 dark:border-blue-500/20",
        badgeBg: "bg-blue-600"
    },
    {
        num: 3,
        title: "Impact Happens",
        desc: "Funds are securely routed directly to verified vendors or institutions (like hospitals or schools) to execute that specific stage of the mission.",
        badge: "Milestone Achieved",
        img: "/howpatient.png",
        icon: Activity,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        border: "border-amber-100 dark:border-amber-500/20",
        badgeBg: "bg-amber-500"
    },
    {
        num: 4,
        title: "Givar Verifies",
        desc: "Our team audits receipts and photographic proof directly from the service delivery site before opening the next funding phase. You see the verified difference you made.",
        badge: "Ledger Verified",
        img: "/howthanks.png",
        icon: FileCheck,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        badgeBg: "bg-primary"
    }
];

export function HowItWorksContent() {
    return (
        <div className="relative w-full overflow-hidden min-h-screen">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.5, scale: 1, y: [0, 40, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/15 via-teal-400/10 to-transparent backdrop-blur-[100px] rounded-full"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.4, scale: 1, y: [0, -30, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-gradient-to-br from-blue-500/10 via-emerald-400/8 to-transparent backdrop-blur-[100px] rounded-full"
                />
            </div>
            <div className="container mx-auto px-4 py-10 md:py-16 max-w-5xl relative z-10">
                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center space-y-4 max-w-2xl mx-auto"
                >
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
                        How <span className="text-primary italic">Givar</span> Works
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed max-w-xl mx-auto">
                        Follow your donation journey from the moment you give to the moment it creates real, verifiable impact.
                    </p>
                </motion.section>
                <div className="relative mt-10 md:mt-14 pb-8">
                    <svg className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[100px] h-full hidden md:block pointer-events-none" preserveAspectRatio="none">
                        <line x1="50" y1="0" x2="50" y2="100%" stroke="url(#glowGradient)" strokeWidth="1.5" strokeDasharray="6 6" />
                        <defs>
                            <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="10%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                                <stop offset="90%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="space-y-16 md:space-y-24">
                        {steps.map((step, index) => {
                            const isEven = index % 2 === 0;
                            return (
                                <div key={step.num} className={cn("flex flex-col md:flex-row items-center gap-0 md:gap-12 lg:gap-20 relative", !isEven ? "md:flex-row-reverse" : "")}>
                                    <div className={cn("hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full text-white items-center justify-center font-black shadow-md z-20 text-sm", step.badgeBg)}>
                                        {step.num}
                                    </div>
                                    <div className="hidden md:block flex-1" />
                                    <div className="w-full md:w-1/2 flex-1 relative flex justify-center">
                                        <div className="relative w-full max-w-[320px] lg:max-w-sm">
                                            <div className={cn("absolute -top-3 -left-3 w-8 h-8 rounded-full text-white flex md:hidden items-center justify-center font-black shadow-md z-20 text-xs", step.badgeBg)}>
                                                {step.num}
                                            </div>
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                whileInView={{ opacity: 1, scale: 1 }}
                                                viewport={{ once: true, margin: "-100px" }}
                                                transition={{ duration: 0.5 }}
                                                className="relative aspect-[4/3] rounded-[28px] overflow-hidden shadow-lg border border-white/10"
                                            >
                                                <Image src={step.img} alt={step.title} fill className="object-cover" />
                                            </motion.div>
                                            <motion.div
                                                initial={{ opacity: 0, y: 15 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true, margin: "-100px" }}
                                                transition={{ duration: 0.5, delay: 0.1 }}
                                                className={cn(
                                                    "relative z-10 w-[94%] mx-auto -mt-8 md:absolute md:mt-0 md:top-[60%] md:-translate-y-1/2 md:w-[100%]",
                                                    isEven
                                                        ? "md:left-[-55%] lg:left-[-65%]"
                                                        : "md:right-[-55%] lg:right-[-65%]"
                                                )}
                                            >
                                                <Card className="p-5 md:p-6 rounded-[28px] bg-card/95 backdrop-blur-md border-border/40 shadow-xl">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm", step.bg, step.color, step.border)}>
                                                            <step.icon className="w-5 h-5" />
                                                        </div>
                                                        <h3 className="text-lg font-bold text-foreground tracking-tight">{step.title}</h3>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                                        {step.desc}
                                                    </p>
                                                    <div className={cn("inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[10px] font-bold w-fit mt-4 shadow-sm", step.bg, step.color, step.border)}>
                                                        <span className={cn("h-1 w-1 rounded-full", step.color.replace('text', 'bg'))} /> {step.badge}
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <motion.section
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="mt-12 md:mt-20 mb-8 text-center max-w-xl mx-auto space-y-6 relative z-10"
                >
                    <div className="space-y-2">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                            Start Making an Impact Today
                        </h2>
                        <p className="text-sm text-muted-foreground font-medium">
                            Support a verified cause with absolute confidence.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
                        <Link href="/explore" className="w-full sm:w-auto">
                            <Button className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-md active:scale-95 transition-all border-0 text-sm">
                                Explore Causes <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/signup" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full h-12 rounded-full bg-card hover:bg-muted text-foreground font-bold px-8 border-border/60 shadow-sm active:scale-95 transition-all text-sm">
                                Create Account
                            </Button>
                        </Link>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}