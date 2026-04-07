import { PublicLayout } from '../../../../components/layout/public-layout';
import { ShieldCheck, Zap, ArrowRight, Target } from 'lucide-react';
import { Metadata } from 'next';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Direct Payments',
    description: 'Learn how Givar makes giving easy, secure, and fast.',
};

export default function DirectPaymentsPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Header */}
                    <div className="text-center space-y-3 pt-2">
                        <h1 className="text-xl md:text-3xl font-black tracking-tighter text-foreground leading-[0.95]">
                            Direct <span className="text-primary italic">Payments</span>.
                        </h1>
                        <div className="h-1 w-16 bg-primary/20 mx-auto rounded-full" />
                    </div>

                    {/* Intro */}
                    <section className="space-y-6 text-center md:text-left">
                        <div className="space-y-5 text-foreground font-medium leading-relaxed text-lg md:text-xl">
                            <p>
                                Giving to a cause shouldn't be a headache. Givar uses a streamlined, direct payment system to make your kindness move faster.
                            </p>
                            <p className="text-muted-foreground">
                                Think of it as a direct pipeline for your giving. You support causes securely via card or bank transfer, and funds are instantly allocated to the active phase of the project.
                            </p>
                        </div>
                    </section>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Card className="rounded-3xl border-border/40 bg-card p-6 md:p-8 space-y-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Safe and sound</h3>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                Payments are processed by enterprise-grade gateways like Paystack. Givar never stores your sensitive card details, ensuring your financial data remains secure.
                            </p>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card p-6 md:p-8 space-y-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                                    <Target className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Phased allocation</h3>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                Your donation goes directly to the currently active phase of the project. We strictly cap inbound funds per phase to guarantee accountability before unlocking the next step.
                            </p>
                        </Card>
                    </div>

                    {/* How it works */}
                    <section className="bg-muted/30 border border-border/50 rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10" />
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">How it <span className="text-primary italic">works</span>.</h2>
                            <div className="space-y-4 text-muted-foreground font-medium leading-relaxed">
                                <p>1. <span className="text-foreground font-bold">Choose a Cause:</span> Browse verified projects that need your help.</p>
                                <p>2. <span className="text-foreground font-bold">Secure Checkout:</span> Support the active phase using your card, Apple Pay, or bank transfer.</p>
                                <p>3. <span className="text-foreground font-bold">Phased Impact:</span> The funds are deployed to verified vendors for that specific milestone.</p>
                                <p>4. <span className="text-foreground font-bold">See the Change:</span> Get notified with photographic proof once the phase is complete.</p>
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-zinc-950 rounded-[40px] p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.15),transparent_70%)]" />
                        <div className="relative z-10 space-y-3">
                            <h2 className="text-3xl font-black text-white tracking-tight">Ready to make a difference?</h2>
                            <p className="text-zinc-400 max-w-lg mx-auto font-medium">
                                Join thousands of people who are making a real impact with Givar.
                            </p>
                            <div className="pt-4 flex justify-center">
                                <Link href="/explore">
                                    <Button size="lg" className="h-12 px-10 rounded-full font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform border-0">
                                        Explore causes <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </PublicLayout>
    );
}