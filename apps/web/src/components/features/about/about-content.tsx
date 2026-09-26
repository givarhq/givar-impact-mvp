'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/button';
import Link from 'next/link';

export function AboutContent() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
            {/* Header Section */}
            <section className="text-center space-y-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                    Giving is <span className="text-primary italic">human</span>.
                </h1>
                <div className="h-1 w-14 bg-primary/30 mx-auto rounded-full" />
            </section>

            {/* Core Narrative Section - Slightly Increased Text Size */}
            <section className="space-y-4 text-center sm:text-left text-base sm:text-lg md:text-xl leading-relaxed font-medium text-muted-foreground">
                <p className="text-foreground font-bold">
                    We believe the impulse to give is part of what makes us human.
                </p>
                <p>
                    People support families, communities, and causes that matter to them. They show up when there is need.
                </p>
                <p>
                    But too often, the systems that connect generosity to impact feel unclear or unreliable. And when trust is missing, that impulse slows down.
                </p>
            </section>

            {/* The Gap Section */}
            <section className="bg-muted/30 border border-border/40 rounded-3xl p-6 sm:p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />
                <div className="relative z-10 space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">The gap</h2>
                    <div className="space-y-3 text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
                        <p>
                            In many communities, the challenge is not a lack of compassion. It is a lack of structure.
                        </p>
                        <p>
                            There isn’t always a simple, transparent system that connects those who have with those who need in a way that feels secure and accountable.
                        </p>
                        <p className="italic text-foreground font-semibold pt-1">
                            Without that structure, good intentions don’t always translate into lasting impact.
                        </p>
                    </div>
                </div>
            </section>

            {/* Our Approach Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
                <div className="p-6 sm:p-8 rounded-3xl border border-border/40 bg-card space-y-3 flex flex-col justify-center">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Our approach</h2>
                    <div className="space-y-2.5 text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
                        <p>
                            Givar exists to close that gap.
                        </p>
                        <p>
                            We provide a trusted, structured platform that makes giving clear, direct, and trackable.
                        </p>
                        <p>
                            By combining a secure direct-payment system with verified causes and transparent activity tracking, we create an environment where generosity can move with confidence.
                        </p>
                    </div>
                </div>

                <div className="p-6 sm:p-8 rounded-3xl border border-primary/20 bg-primary/[0.03] flex flex-col justify-center">
                    <div className="space-y-4">
                        {[
                            "Giving becomes simple.",
                            "Impact becomes visible.",
                            "Trust becomes foundational."
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-sm sm:text-base font-bold text-foreground">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Givar Was Created Section (Founder) */}
            <section className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-8 items-center bg-card border border-border/40 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="sm:col-span-4 flex flex-col items-center text-center space-y-2.5">
                    <div className="relative aspect-square w-32 sm:w-40 rounded-2xl overflow-hidden border border-border shadow-sm bg-muted">
                        <Image
                            src="/founder-photo.png"
                            alt="Folarin Ajayi"
                            fill
                            sizes="(max-width: 640px) 128px, 160px"
                            className="object-cover"
                            priority
                        />
                    </div>
                    <div className="space-y-0.5">
                        <h4 className="text-base font-bold text-foreground">Folarin Ajayi</h4>
                        <p className="text-xs font-semibold text-muted-foreground">Founder, Givar</p>
                    </div>
                </div>

                <div className="sm:col-span-8 space-y-3">
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Why Givar was created</h3>
                    <div className="space-y-2.5 text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
                        <p>
                            I grew up seeing people who wanted to help, and people who needed help, but the systems connecting them were often informal or unreliable.
                        </p>
                        <p>
                            Over time, I realized that many efforts don’t fail because people lack compassion — they fail because there isn’t a clear, trustworthy structure to support giving.
                        </p>
                        <p className="text-primary font-bold pt-1">
                            That realization became the foundation for Givar.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-zinc-950 rounded-3xl p-6 sm:p-10 text-center space-y-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.15),transparent_70%)] pointer-events-none" />
                <div className="relative z-10 space-y-2.5 max-w-lg mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Ready to make an impact?</h2>
                    <p className="text-zinc-400 font-medium text-sm leading-relaxed">
                        Join the Givar network and start supporting verified causes with 100% transparency.
                    </p>
                    <div className="pt-2 flex justify-center">
                        <Link href="/explore">
                            <Button size="lg" className="h-12 px-8 rounded-full font-bold bg-primary text-white shadow-md hover:bg-primary/90 transition-all border-0 text-sm">
                                Explore causes <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}