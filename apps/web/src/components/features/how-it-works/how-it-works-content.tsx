'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    CreditCard,
    Landmark,
    Heart,
    ShieldCheck,
    ArrowRight,
    CheckCircle2,
    Lock,
    Users,
    FileText
} from 'lucide-react';
import { cn } from '../../../lib/utils/cn';

const steps = [
    {
        num: 1,
        title: "You Give",
        desc: "You contribute securely to a verified cause you care about.",
        badge: "Your donation is safe and secure.",
        img: "/howphone.png",
        icon: CreditCard,
    },
    {
        num: 2,
        title: "Direct To Providers",
        desc: "Funds are sent directly to verified providers to meet real needs.",
        badge: "No middlemen. No delays.",
        img: "/howlap.png",
        icon: Landmark,
    },
    {
        num: 3,
        title: "Impact Happens",
        desc: "Lives improve. Communities grow. Real change takes place.",
        badge: "This is the reason you give.",
        img: "/howpatient.png",
        icon: Heart,
    },
    {
        num: 4,
        title: "See Your Impact",
        desc: "See verified outcomes and the impact your support made.",
        badge: "Verified. Transparent. Impactful.",
        img: "/howthanks.png",
        icon: ShieldCheck,
    }
];

export function HowItWorksContent() {
    return (
        <div className="relative w-full min-h-screen pb-24 overflow-hidden bg-background">
            {/* Background Accents */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ duration: 1.5 }}
                    className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-bl from-emerald-500/10 to-transparent blur-[120px] rounded-full"
                />
            </div>

            <div className="container mx-auto px-4 py-12 md:py-20 max-w-[1400px] relative z-10">
                {/* Header Section */}
                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-4 max-w-3xl mx-auto"
                >
                    <p className="text-xs font-bold tracking-widest text-emerald-600 uppercase">
                        How It Works
                    </p>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]">
                        Transparent Impact. <span className="text-primary">Every Step.</span>
                    </h1>
                    <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto pt-2">
                        We make giving simple, accountable, and meaningful. Here's how your support creates real change.
                    </p>
                </motion.section>

                {/* Steps Grid */}
                <div className="relative mt-24">
                    {/* Connecting Dashed Line (Desktop Only) */}
                    <div className="absolute top-6 left-[12.5%] right-[12.5%] h-px border-t-2 border-dashed border-emerald-500/30 hidden lg:block z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 relative z-10">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.num}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="relative flex flex-col items-center text-center group"
                            >
                                {/* Floating Icon */}
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 h-12 w-12 bg-card rounded-full border border-border/60 shadow-lg flex items-center justify-center text-emerald-600 transition-transform duration-300 group-hover:scale-110">
                                    <step.icon className="h-5 w-5" />
                                </div>

                                {/* Connecting Arrow (Desktop) */}
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:flex absolute -right-4 top-[40%] translate-x-1/2 z-20 h-7 w-7 rounded-full bg-emerald-600 text-white items-center justify-center shadow-md border-[3px] border-background">
                                        <ArrowRight className="h-3 w-3" />
                                    </div>
                                )}

                                {/* Image Card */}
                                <div className="relative w-full aspect-[4/5] rounded-[28px] overflow-hidden bg-muted mb-8 shadow-sm border border-border/40 mt-6">
                                    <Image
                                        src={step.img}
                                        alt={step.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    {/* Inner shadow overlay for depth */}
                                    <div className="absolute inset-0 border border-black/5 rounded-[28px] pointer-events-none" />
                                </div>

                                {/* Text Content */}
                                <h3 className="text-xl font-bold text-foreground mb-3">
                                    {step.num}. {step.title}
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6 flex-1 px-2">
                                    {step.desc}
                                </p>

                                {/* Bottom Badge */}
                                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full mt-auto shadow-sm transition-colors">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
                                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                        {step.badge}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom Trust Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-20 md:mt-28 flex flex-col xl:flex-row items-center justify-center gap-6 lg:gap-8 p-6 lg:p-4 rounded-[32px] lg:rounded-full bg-card border border-border/60 shadow-lg w-fit mx-auto relative overflow-hidden"
                >
                    <div className="flex items-center gap-3 pr-0 xl:pr-6 border-b xl:border-b-0 xl:border-r border-border/40 pb-4 xl:pb-0 z-10">
                        <Image src="/Givar1.png" alt="Givar" width={28} height={28} className="object-contain" />
                        <span className="text-lg md:text-xl font-black text-foreground tracking-tight">Give With Confidence.</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8 z-10">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                            <span className="text-xs font-bold text-muted-foreground">Verified Causes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="h-4.5 w-4.5 text-emerald-600" />
                            <span className="text-xs font-bold text-muted-foreground">Secure Payments</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4.5 w-4.5 text-emerald-600" />
                            <span className="text-xs font-bold text-muted-foreground">Real Impact</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4.5 w-4.5 text-emerald-600" />
                            <span className="text-xs font-bold text-muted-foreground">Transparent Updates</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}