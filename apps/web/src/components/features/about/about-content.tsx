'use client';

import React from 'react';
import { ShieldCheck, Heart, Zap, Globe, Users, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/button';
import Link from 'next/link';

export function AboutContent() {
    return (
        <div className="max-w-4xl mx-auto md:-mt-10 space-y-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <section className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black  tracking-[0.2em] mb-4">
                    <Heart className="h-3 w-3 fill-current" /> Humanizing Philanthropy
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground leading-[0.95]">
                    Giving should feel <br />
                    <span className="text-primary italic">human again.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
                    Givar is building a new way for people and organisations to give — one that’s simple, transparent, and genuinely impact-driven.
                </p>
            </section>

            {/* Manifesto Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">The Givar Impact Philosophy</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                        <p>
                            Traditional giving has become a black box. You send money, but the connection to the result often fades into annual reports and opaque spreadsheets.
                        </p>
                        <p className="text-foreground font-semibold">
                            We’re starting with Givar Impact: a collective fund that allows people to pool their giving and support real-world causes together.
                        </p>
                        <p>
                            This MVP is about proving that giving can feel human again — not transactional, and never opaque. By verifying every milestone on our ledger, we ensure that your generosity translates directly into action.
                        </p>
                    </div>
                </div>
                <div className="bg-muted/30 border border-border/50 rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10" />
                    <div className="relative z-10 space-y-6">
                        <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center shadow-xl border border-border/50 transition-transform group-hover:scale-110 duration-500">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight">The Transparency Protocol</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            We track every cent from your wallet to the project's execution. No middlemen, no hidden fees, just pure impact.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values Grid */}
            <section className="space-y-12">
                <div className="text-center">
                    <h2 className="text-2xl font-black  tracking-widest text-foreground/20">Our Pillars</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: Zap, title: "Simple", desc: "One-click donations, automated recurring support, and an intuitive dashboard to manage your giving portfolio." },
                        { icon: Globe, title: "Transparent", desc: "Verifiable proof of work for every project. See photos, receipts, and location data for the work you fund." },
                        { icon: Users, title: "Impact-Driven", desc: "We focus on real-world outcomes. From clean water to education, we support causes that move the needle." }
                    ].map((v, i) => (
                        <div key={i} className="p-8 rounded-[32px] border border-border/50 bg-card hover:border-primary/30 transition-all duration-300">
                            <v.icon className="h-8 w-8 text-primary mb-6" />
                            <h4 className="text-lg font-bold mb-2">{v.title}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-zinc-950 rounded-[48px] p-8 md:p-16 text-center space-y-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.15),transparent_70%)]" />
                <div className="relative z-10 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Ready to humanize your giving?</h2>
                    <p className="text-zinc-400 max-w-lg mx-auto">
                        Join the Givar network and start supporting verified causes with 100% transparency.
                    </p>
                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup">
                            <Button size="lg" className="h-14 px-10 rounded-full font-bold bg-primary text-white shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:scale-105 transition-transform">
                                Create Impact Wallet
                            </Button>
                        </Link>
                        <Link href="/explore">
                            <Button variant="ghost" className="text-white hover:bg-white/10 h-14 px-8 rounded-full font-bold">
                                Explore Causes <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}