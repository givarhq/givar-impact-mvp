import { PublicLayout } from '../../../components/layout/public-layout';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, FileText, Users, Heart, BarChart3 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';

export const metadata: Metadata = {
    title: 'For Companies',
    description: 'Turn your CSR budget into verified, transparent impact.',
};

export default function ForCompaniesPage() {
    return (
        <PublicLayout>
            <div className="w-full min-w-0 overflow-hidden bg-background">
                {/* HERO SECTION */}
                <section className="relative w-full max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20 lg:pb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                        <div className="flex flex-col space-y-8 z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div>
                                <span className="text-sm font-bold text-primary tracking-widest uppercase">For Companies</span>
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground mt-4 mb-6 leading-[1.1]">
                                    Let Givar Be Your CSR Engine.
                                </h1>
                                <p className="text-xl md:text-2xl font-bold text-foreground mb-4">
                                    Turn your CSR budget into verified, transparent impact.
                                </p>
                                <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-xl">
                                    Givar finds and verifies genuine needs, facilitates payments directly to trusted providers, and documents the outcome, giving your organisation a simple and credible way to make a real difference.
                                </p>
                            </div>

                            <div className="space-y-4 pt-2">
                                <Link href="/for-companies/partner">
                                    <Button size="lg" className="h-14 px-8 rounded-full font-bold text-base shadow-lg shadow-primary/20 transition-all active:scale-95 border-0 bg-primary text-white hover:bg-primary/90">
                                        Partner With Givar <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <p className="text-sm font-medium text-muted-foreground ml-2">
                                    Real needs. Real people. Real impact.
                                </p>
                            </div>
                        </div>

                        <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[600px] rounded-[32px] overflow-hidden bg-muted shadow-xl border border-border/40 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 group">
                            <Image
                                src="/For-Companies-Image.png"
                                alt="Givar Corporate Impact"
                                fill
                                priority
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            {/* Decorative Handwritten Annotation */}
                            <div className="absolute bottom-6 left-4 md:-left-4 rotate-[-4deg] bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-border/20 z-10 hidden sm:block">
                                <p className="text-emerald-700 font-serif italic text-lg md:text-xl font-bold">
                                    A brighter tomorrow is possible. ♡
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* HOW IT WORKS SECTION */}
                <section className="bg-muted/20 border-t border-b border-border/40 py-20 lg:py-32">
                    <div className="max-w-7xl mx-auto px-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        <div className="text-center space-y-4 mb-16 max-w-2xl mx-auto">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
                                Your CSR. Powered By Givar.
                            </h2>
                            <p className="text-lg md:text-xl font-medium text-muted-foreground">
                                You provide the funding. We handle the work.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
                            {[
                                {
                                    num: 1,
                                    icon: FileText,
                                    title: "1. You Set Your Focus",
                                    desc: "Tell us your budget and the causes you care about.",
                                    color: "text-primary",
                                    bg: "bg-primary/10 border-primary/20"
                                },
                                {
                                    num: 2,
                                    icon: Users,
                                    title: "2. We Find And Verify",
                                    desc: "We source and verify genuine needs with supporting evidence.",
                                    color: "text-blue-500",
                                    bg: "bg-blue-500/10 border-blue-500/20"
                                },
                                {
                                    num: 3,
                                    icon: Heart,
                                    title: "3. You Support",
                                    desc: "Select causes to fund.",
                                    color: "text-rose-500",
                                    bg: "bg-rose-500/10 border-rose-500/20"
                                },
                                {
                                    num: 4,
                                    icon: BarChart3,
                                    title: "4. See The Impact",
                                    desc: "We track the funding and document the outcome, so you can see the real difference your support made.",
                                    color: "text-amber-500",
                                    bg: "bg-amber-500/10 border-amber-500/20"
                                }
                            ].map((step) => (
                                <Card key={step.num} className="rounded-3xl border-border/40 shadow-sm bg-card overflow-hidden hover:shadow-md transition-shadow">
                                    <CardContent className="p-6 md:p-8 space-y-5">
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border shadow-inner ${step.bg}`}>
                                            <step.icon className={`h-6 w-6 ${step.color}`} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-bold text-foreground leading-tight">
                                                {step.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="mt-16 flex justify-center">
                            <Link href="/for-companies/partner">
                                <Button size="lg" className="h-14 px-8 rounded-full font-bold text-base shadow-lg shadow-primary/20 transition-all active:scale-95 border-0 bg-primary text-white hover:bg-primary/90">
                                    Partner With Givar <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* CLOSING SECTION */}
                <section className="w-full max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-[1.1] max-w-3xl mx-auto">
                            Together, We Can Build A More Transparent, Compassionate World.
                        </h2>

                        <div className="flex justify-center md:justify-end max-w-4xl mx-auto pt-6">
                            <div className="relative inline-block text-right">
                                <p className="text-emerald-600 font-serif italic text-2xl md:text-3xl font-bold pr-2">
                                    Radical transparency. Real impact.
                                </p>
                                {/* Decorative Brush Underline */}
                                <div className="absolute -bottom-2 right-0 w-[85%] h-2 bg-primary/20 rounded-full" />
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </PublicLayout>
    );
}