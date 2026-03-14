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
        desc: "Support a verified cause instantly using card, bank transfer or your Givar wallet.",
        badge: "Capital Deployed",
        img: "/howphone.png",
        icon: Wallet,
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        border: "border-emerald-100 dark:border-emerald-500/20"
    },
    {
        num: 2,
        title: "Funds Secured",
        desc: "Your donation is protected in Givar's treasury and released only when milestones are verified.",
        badge: "Treasury Protected",
        img: "/howlap.png",
        icon: ShieldCheck,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-500/10",
        border: "border-blue-100 dark:border-blue-500/20"
    },
    {
        num: 3,
        title: "Impact Happens",
        desc: "Funds are paid directly to hospitals, schools or trusted vendors to execute the mission.",
        badge: "Milestone Achieved",
        img: "/howpatient.png",
        icon: Activity,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-500/10",
        border: "border-amber-100 dark:border-amber-500/20"
    },
    {
        num: 4,
        title: "You Get Proof",
        desc: "Receipts, photos and updates are uploaded to the cause page so you always see the difference you made.",
        badge: "Ledger Verified",
        img: "/howthanks.png",
        icon: FileCheck,
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20"
    }
];

export function HowItWorksContent() {
    return (
        <div className="relative w-full overflow-hidden min-h-screen">
            {/* Background Glassmorphic Glowing Orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.7, scale: 1, y: [0, 40, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/20 via-teal-400/15 to-transparent backdrop-blur-[100px] rounded-full"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.6, scale: 1, y: [0, -30, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-[30%] right-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-blue-500/15 via-emerald-400/10 to-transparent backdrop-blur-[100px] rounded-full"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.7, scale: 1, y: [0, 50, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[10%] left-[20%] w-[700px] h-[700px] bg-gradient-to-br from-teal-500/15 via-primary/10 to-transparent backdrop-blur-[120px] rounded-full"
                />
            </div>

            <div className="container mx-auto px-4 py-16 md:py-24 max-w-5xl relative z-10">

                {/* Hero Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-6 max-w-3xl mx-auto"
                >
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
                        Experience How <span className="text-primary italic">Givar</span> Works
                    </h1>
                    <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                        Follow your donation from the moment you give to the moment it creates real impact — with transparency and proof every step of the way.
                    </p>
                </motion.section>

                {/* Timeline Journey */}
                <div className="relative mt-24 md:mt-32 pb-16">
                    {/* Central Vertical Dashed Line (Desktop only) */}
                    <svg className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[100px] h-full hidden md:block pointer-events-none" preserveAspectRatio="none">
                        <line x1="50" y1="0" x2="50" y2="100%" stroke="url(#glowGradient)" strokeWidth="2" strokeDasharray="8 8" />
                        <defs>
                            <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="10%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                                <stop offset="90%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <div className="space-y-24 md:space-y-32">
                        {steps.map((step, index) => {
                            const isEven = index % 2 === 0;

                            return (
                                <div key={step.num} className={cn("flex flex-col md:flex-row items-center gap-0 md:gap-16 lg:gap-24 relative", !isEven ? "md:flex-row-reverse" : "")}>

                                    {/* Central Number Node (Desktop) */}
                                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-primary text-white items-center justify-center font-black shadow-lg shadow-primary/40 z-20 text-lg">
                                        {step.num}
                                    </div>

                                    {/* Empty Space for Alternating Layout */}
                                    <div className="hidden md:block flex-1" />

                                    {/* Content Block */}
                                    <div className="w-full md:w-1/2 flex-1 relative flex justify-center">
                                        <div className="relative w-full max-w-sm lg:max-w-md">

                                            {/* Number Node (Mobile) */}
                                            <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-primary text-white flex md:hidden items-center justify-center font-black shadow-lg shadow-primary/40 z-20 text-base">
                                                {step.num}
                                            </div>

                                            {/* Image */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true, margin: "-100px" }}
                                                transition={{ duration: 0.6 }}
                                                className="relative aspect-[4/3] rounded-[32px] overflow-hidden shadow-xl border border-white/10 dark:border-white/5"
                                            >
                                                <Image src={step.img} alt={step.title} fill className="object-cover" />
                                            </motion.div>

                                            {/* Overlapping Detail Card */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true, margin: "-100px" }}
                                                transition={{ duration: 0.6, delay: 0.2 }}
                                                className={cn(
                                                    "relative z-10 w-[92%] mx-auto -mt-16 md:absolute md:mt-0 md:top-1/2 md:-translate-y-1/2 md:w-[115%]",
                                                    isEven ? "md:left-[-25%] lg:left-[-35%]" : "md:right-[-25%] lg:right-[-35%]"
                                                )}
                                            >
                                                <Card className="p-6 md:p-8 rounded-[32px] bg-card border-border/40 shadow-2xl">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm", step.bg, step.color, step.border)}>
                                                            <step.icon className="w-6 h-6" />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-foreground tracking-tight">{step.title}</h3>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                                        {step.desc}
                                                    </p>
                                                    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold w-fit mt-5 shadow-sm", step.bg, step.color, step.border)}>
                                                        <span className={cn("h-1.5 w-1.5 rounded-full", step.color.replace('text', 'bg'))} /> {step.badge}
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

                {/* Final CTA */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mt-16 md:mt-24 mb-16 text-center max-w-2xl mx-auto space-y-8 relative z-10"
                >
                    <div className="space-y-3">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
                            Start Making an Impact Today
                        </h2>
                        <p className="text-base text-muted-foreground font-medium">
                            Support a verified cause and experience transparent giving with confidence.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                        <Link href="/explore" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-white font-bold px-10 shadow-lg shadow-primary/20 active:scale-95 transition-all border-0">
                                Explore Causes <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/signup" className="w-full sm:w-auto">
                            <Button size="lg" variant="outline" className="w-full h-14 rounded-full bg-card hover:bg-muted text-foreground font-bold px-10 border-border/60 shadow-sm active:scale-95 transition-all">
                                Create Account
                            </Button>
                        </Link>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}