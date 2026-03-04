'use client';

import React from 'react';
import Image from 'next/image';
import { Heart, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/button';
import Link from 'next/link';

export function AboutContent() {
    return (
        <div className="max-w-5xl mx-auto space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <section className="text-center space-y-4 pt-4">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground leading-[0.95]">
                    Giving Is Human.
                </h1>
                <div className="h-1 w-20 bg-primary/20 mx-auto rounded-full" />
            </section>

            {/* Core Narrative Section */}
            <section className="space-y-8 max-w-5xl mx-auto text-center md:text-left">
                <div className="space-y-6 text-foreground font-medium leading-relaxed text-lg md:text-xl">
                    <p>
                        We believe the impulse to give is part of what makes us human.
                    </p>
                    <p className="text-muted-foreground">
                        People support families, communities, and causes that matter to them. They show up when there is need.
                    </p>
                    <p className="text-muted-foreground">
                        But too often, the systems that connect generosity to impact feel unclear or unreliable. And when trust is missing, that impulse slows down.
                    </p>
                </div>
            </section>

            {/* The Gap Section */}
            <section className="bg-muted/30 border border-border/50 rounded-3xl p-8 md:p-12 relative overflow-hidden group max-w-5xl mx-auto">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10" />
                <div className="relative z-10 space-y-6">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">The Gap</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed font-medium">
                        <p>
                            In many communities, the challenge is not a lack of compassion. It is a lack of structure.
                        </p>
                        <p>
                            There isn’t always a simple, transparent system that connects those who have with those who need in a way that feels secure and accountable.
                        </p>
                        <p className="italic text-foreground">
                            Without that structure, good intentions don’t always translate into lasting impact.
                        </p>
                    </div>
                </div>
            </section>

            {/* Our Approach Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Our Approach</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed font-medium">
                        <p>
                            Givar exists to close that gap.
                        </p>
                        <p>
                            We provide a trusted, structured platform that makes giving clear, direct, and trackable.
                        </p>
                        <p>
                            By combining a secure wallet system with verified causes and transparent activity tracking, we create an environment where generosity can move with confidence.
                        </p>
                    </div>
                </div>
                <div className="space-y-4 p-8 rounded-3xl border border-primary/20 bg-primary/[0.02]">
                    <div className="space-y-4">
                        {[
                            "Giving becomes simple.",
                            "Impact becomes visible.",
                            "Trust becomes foundational."
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-bold text-foreground">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* More Than a Platform Section */}
            <section className="space-y-6 max-w-5xl mx-auto border-t border-border/40 pt-16">
                <h2 className="text-2xl font-bold tracking-tight text-primary">More Than a Platform</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed font-medium">
                    <p className="text-foreground font-bold text-lg">
                        Givar is not a charity. It is infrastructure.
                    </p>
                    <p>
                        We are building a giving ecosystem — one that connects individuals, communities, and organizations in a way that promotes consistency, accountability, and long-term impact.
                    </p>
                    <p>
                        Our goal is not just to facilitate transactions. It is to help create a culture of giving.
                    </p>
                </div>
            </section>

            {/* Why Givar Was Created Section (Founder) */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center bg-card border border-border/40 rounded-[48px] p-8 md:p-12 shadow-sm max-w-5xl mx-auto">
                <div className="md:col-span-4 flex flex-col items-center text-center space-y-4">
                    <div className="relative aspect-[1015/1100] w-full max-w-[280px] rounded-2xl overflow-hidden border border-border shadow-md bg-muted">
                        <Image
                            src="/founder-photo.png"
                            alt="Folarin Ajayi"
                            fill
                            sizes="(max-width: 768px) 280px, 400px"
                            className="object-cover grayscale hover:grayscale-0 transition-all duration-700"
                            priority
                        />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-lg font-bold text-foreground">Folarin Ajayi</h4>
                        <p className="text-xs font-bold text-muted-foreground">Founder, Givar</p>
                    </div>
                </div>
                <div className="md:col-span-8 space-y-6">
                    <h3 className="text-2xl font-black tracking-tight text-foreground">Why Givar Was Created</h3>
                    <div className="space-y-4 text-muted-foreground leading-relaxed font-medium">
                        <p>
                            I grew up seeing people who wanted to help, and people who needed help, but the systems connecting them were often informal or unreliable.
                        </p>
                        <p>
                            Over time, I realized that many efforts fail because where people lack compassion — they fail because there isn’t a clear, trustworthy structure to support giving.
                        </p>
                        <p className="text-primary font-bold">
                            That realization became the foundation for Givar.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-zinc-950 rounded-[48px] p-8 md:p-16 text-center space-y-8 relative overflow-hidden max-w-5xl mx-auto">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.15),transparent_70%)]" />
                <div className="relative z-10 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Ready to make an impact?</h2>
                    <p className="text-zinc-400 max-w-lg mx-auto font-medium">
                        Join the Givar network and start supporting verified causes with 100% transparency.
                    </p>
                    <div className="pt-6 flex justify-center">
                        <Link href="/explore">
                            <Button size="lg" className="h-14 px-10 rounded-full font-bold bg-primary text-white shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:scale-105 transition-transform border-0">
                                Explore Causes <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}