'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
import { Button } from '../../ui/button';
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

export function HowItWorksContent({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
    return (
        <div className="relative w-full pb-16 overflow-hidden bg-background">
            {/* Background Accents */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ duration: 1.5 }}
                    className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-bl from-emerald-500/10 to-transparent blur-[120px] rounded-full"
                />
            </div>

            <div className="container mx-auto px-4 pt-6 pb-12 md:pt-10 max-w-[1400px] relative z-10">
                {/* Header Section */}
                <motion.section
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-3 max-w-3xl mx-auto"
                >
                    <p className="text-[11px] md:text-xs font-bold tracking-widest text-emerald-600 uppercase">
                        How It Works
                    </p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
                        Transparent Impact. <span className="text-primary">Every Step.</span>
                    </h1>
                    <div className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto pt-1 space-y-1">
                        <p>We make giving simple, accountable, and meaningful.</p>
                        <p>Here's how your support creates real change.</p>
                    </div>
                </motion.section>

                {/* Steps Grid */}
                <div className="relative mt-10 md:mt-14">
                    {/* Playfully Wavy Connecting Dotted Line (Desktop Only) */}
                    <div className="absolute top-0 left-[12.5%] right-[12.5%] -translate-y-1/2 hidden lg:block z-0 pointer-events-none h-10">
                        <svg width="100%" height="100%" viewBox="0 0 1000 32" preserveAspectRatio="none" className="overflow-visible">
                            <path
                                d="M 0,16 C 166,46 166,-14 333,16 C 500,46 500,-14 666,16 C 833,46 833,-14 1000,16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeDasharray="6 6"
                                className="text-emerald-500/30"
                            />
                        </svg>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6 relative z-10">
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

                                {/* Image Card */}
                                <div className="relative w-full aspect-[762/519] rounded-[24px] overflow-hidden bg-muted mb-5 shadow-sm border border-border/40 mt-6">
                                    <Image
                                        src={step.img}
                                        alt={step.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    {/* Inner shadow overlay for depth */}
                                    <div className="absolute inset-0 border border-black/5 rounded-[24px] pointer-events-none" />
                                </div>

                                {/* Text Content */}
                                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
                                    {step.num}. {step.title}
                                </h3>
                                <p className="text-[13px] md:text-sm text-muted-foreground font-medium leading-snug mb-5 flex-1 px-1">
                                    {step.desc}
                                </p>

                                {/* Bottom Badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full mt-auto shadow-sm transition-colors">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-500 shrink-0" />
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
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
                    className="mt-16 md:mt-20 flex flex-col xl:flex-row items-center justify-center gap-6 lg:gap-8 p-5 lg:p-4 rounded-[32px] lg:rounded-full bg-card border border-border/60 shadow-lg w-fit mx-auto relative overflow-hidden"
                >
                    <div className="flex items-center gap-3 pr-0 xl:pr-6 border-b xl:border-b-0 xl:border-r border-border/40 pb-4 xl:pb-0 z-10">
                        <Image src="/Givar1.png" alt="Givar" width={24} height={24} className="object-contain" />
                        <span className="text-base md:text-lg font-black text-foreground tracking-tight">Give With Confidence.</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-5 lg:gap-8 z-10">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                            <span className="text-[11px] md:text-xs font-bold text-muted-foreground">Verified Causes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="h-4.5 w-4.5 text-emerald-600" />
                            <span className="text-[11px] md:text-xs font-bold text-muted-foreground">Secure Payments</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4.5 w-4.5 text-emerald-600" />
                            <span className="text-[11px] md:text-xs font-bold text-muted-foreground">Real Impact</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText className="h-4.5 w-4.5 text-emerald-600" />
                            <span className="text-[11px] md:text-xs font-bold text-muted-foreground">Transparent Updates</span>
                        </div>
                    </div>
                </motion.div>

                {/* Bottom CTA Action - Only show if not logged in */}
                {!isAuthenticated && (
                    <motion.section
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="mt-12 md:mt-16 mb-4 text-center max-w-xl mx-auto space-y-5 relative z-10"
                    >
                        <div className="space-y-1.5">
                            <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                                Ready to make a difference?
                            </h2>
                            <p className="text-xs md:text-sm text-muted-foreground font-medium">
                                Join thousands of people creating real impact with Givar.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
                            <Link href="/explore" className="w-full sm:w-auto">
                                <Button className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-md active:scale-95 transition-all border-0 text-sm">
                                    Explore Causes <ArrowRight className="ml-1.5 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/signup" className="w-full sm:w-auto">
                                <Button variant="outline" className="w-full h-11 rounded-full bg-card hover:bg-muted text-foreground font-bold px-8 border-border/60 shadow-sm active:scale-95 transition-all text-sm">
                                    Create Account
                                </Button>
                            </Link>
                        </div>
                    </motion.section>
                )}

            </div>
        </div>
    );
}