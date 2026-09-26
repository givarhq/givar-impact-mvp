import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Caveat } from 'next/font/google';
import { ArrowRight, FileText, Users, Heart, BarChart3 } from 'lucide-react';
import { LandingHeader } from '../../../components/layout/landing-header';
import { Footer } from '../../../components/layout/footer';
import { Button } from '../../../components/ui/button';

const caveat = Caveat({
    subsets: ['latin'],
    weight: ['600', '700'],
    variable: '--font-caveat',
});

export const metadata: Metadata = {
    title: 'For Companies',
    description: 'Turn your CSR budget into verified, transparent impact.',
};

const steps = [
    {
        num: 1,
        title: '1. You Set Your Focus',
        desc: 'Tell us your budget and the causes you care about.',
        icon: FileText,
    },
    {
        num: 2,
        title: '2. We Find And Verify',
        desc: 'We source and verify genuine needs with supporting evidence.',
        icon: Users,
    },
    {
        num: 3,
        title: '3. You Support',
        desc: 'Select causes to fund.',
        icon: Heart,
    },
    {
        num: 4,
        title: '4. See The Impact',
        desc: 'We track the funding and document the outcome, so you can see the real difference your support made.',
        icon: BarChart3,
    },
];

export default function ForCompaniesPage() {
    return (
        <div className={`min-h-screen w-full bg-[#fbfdfc] dark:bg-background text-foreground font-sans ${caveat.variable} selection:bg-primary/20 overflow-x-hidden`}>
            <LandingHeader />

            <main className="w-full">
                {/* HERO SECTION */}
                <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 pt-28 sm:pt-36 lg:pt-36 pb-16 lg:pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">

                        {/* Left Content Column */}
                        <div className="lg:col-span-5 flex flex-col space-y-6 z-10">
                            <span className="text-xs sm:text-sm font-black tracking-widest text-primary uppercase">
                                For Companies
                            </span>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0f172a] dark:text-white leading-[1.08]">
                                Let Givar Be <br />
                                Your <span className="text-primary">CSR Engine.</span>
                            </h1>

                            <p className="text-lg sm:text-xl font-bold text-[#1e293b] dark:text-zinc-100 leading-snug">
                                Turn your CSR budget into verified, transparent impact.
                            </p>

                            <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed max-w-xl">
                                Givar finds and verifies genuine needs, facilitates payments directly to trusted providers, and documents the outcome, giving your organisation a simple and credible way to make a real difference.
                            </p>

                            <div className="pt-2 space-y-4">
                                <Link href="/for-companies/partner">
                                    <Button className="h-12 sm:h-13 px-8 rounded-full font-bold text-sm sm:text-base bg-primary hover:bg-primary/90 text-white shadow-md active:scale-95 transition-all border-0">
                                        Partner With Givar <ArrowRight className="ml-2 h-4 w-4 stroke-[2.5]" />
                                    </Button>
                                </Link>

                                <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                                    Real needs. Real people. Real impact.
                                </p>
                            </div>
                        </div>

                        {/* Right Visual Column (Wide landscape format with blended left gradient edge) */}
                        <div className="lg:col-span-7 relative flex justify-center lg:justify-end items-center">
                            <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] lg:h-[480px] rounded-3xl overflow-hidden">

                                {/* Seamless Left Fade Overlay */}
                                <div className="hidden lg:block absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#fbfdfc] dark:from-background to-transparent z-10 pointer-events-none" />

                                {/* Handwritten Annotation inside top-right corner */}
                                <div className="absolute top-3 right-3 sm:top-5 sm:right-6 z-20 pointer-events-none select-none text-right">
                                    <p className="font-caveat text-xl sm:text-2xl font-bold text-primary leading-tight -rotate-[6deg]">
                                        A brighter <br />
                                        tomorrow <br />
                                        is possible.
                                    </p>
                                    <div className="flex justify-end items-center mt-0.5 mr-2">
                                        <svg width="22" height="18" viewBox="0 0 40 36" fill="none" className="text-primary stroke-current stroke-[2.5]">
                                            <path d="M20 32C20 32 4 22 4 11C4 5 8.5 2 13.5 2C17 2 19 4 20 6C21 4 23 2 26.5 2C31.5 2 36 5 36 11C36 22 20 32 20 32Z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div className="w-12 h-0.5 bg-primary rounded-full ml-auto mt-1 -rotate-[6deg]" />
                                </div>

                                {/* Photo Element */}
                                <Image
                                    src="/For-Companies-Image.png"
                                    alt="A young school student smiling in a classroom"
                                    fill
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 700px"
                                    className="object-cover object-center"
                                />
                            </div>
                        </div>

                    </div>
                </section>

                {/* SECTION 2: 4 STEPS UNIFORM CARDS (Aligned with How It Works design) */}
                <section className="w-full bg-[#f8fafc] dark:bg-zinc-950/40 py-20 lg:py-24 border-t border-border/40">
                    <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center space-y-14">

                        <div className="space-y-3">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0f172a] dark:text-white">
                                Your CSR. <span className="text-primary">Powered By Givar.</span>
                            </h2>
                            <p className="text-base sm:text-lg font-bold text-muted-foreground">
                                You provide the funding. We handle the work.
                            </p>
                        </div>

                        {/* 4 Cards Grid with Inter-Card Arrow Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative items-stretch">
                            {steps.map((step, index) => (
                                <div key={step.num} className="relative flex flex-col items-center h-full group">

                                    {/* Card Body */}
                                    <div className="bg-card w-full rounded-[32px] border border-border/40 shadow-sm p-4 sm:p-5 pb-6 flex flex-col items-center text-center h-full relative z-10 hover:shadow-md transition-shadow">

                                        {/* Top Aspect-Ratio Container Holding Icon */}
                                        <div className="relative w-full aspect-[762/519] rounded-[24px] bg-primary/10 flex items-center justify-center mb-5">
                                            <step.icon className="h-10 w-10 text-primary stroke-[2.2]" />
                                        </div>

                                        <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed flex-1">
                                            {step.desc}
                                        </p>
                                    </div>

                                    {/* Inter-Card Arrow Badge (Matching How It Works) */}
                                    {index < steps.length - 1 && (
                                        <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 h-6 w-6 rounded-full bg-primary shadow-sm items-center justify-center text-white z-30">
                                            <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Centered Action Button */}
                        <div className="pt-6">
                            <Link href="/for-companies/partner">
                                <Button className="h-12 px-8 rounded-full font-bold text-sm bg-primary hover:bg-primary/90 text-white shadow-md active:scale-95 transition-all border-0">
                                    Partner With Givar <ArrowRight className="ml-2 h-4 w-4 stroke-[2.5]" />
                                </Button>
                            </Link>
                        </div>

                    </div>
                </section>

                {/* SECTION 3: CLOSING BANNER WITH BRAND GREEN WAVE */}
                <section className="relative w-full bg-white dark:bg-background overflow-hidden py-24 lg:py-28">

                    {/* Brand Green Organic Wave Backdrop */}
                    <div className="absolute inset-0 pointer-events-none">
                        <svg
                            className="w-full h-full object-cover"
                            viewBox="0 0 1440 380"
                            fill="none"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M0 320C320 380 720 280 1440 120V380H0V320Z"
                                fill="hsl(var(--primary))"
                                fillOpacity="0.10"
                            />
                            <path
                                d="M0 240C400 360 920 200 1440 80V380H0V240Z"
                                fill="hsl(var(--primary))"
                                fillOpacity="0.05"
                            />
                        </svg>
                    </div>

                    <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                            {/* Left Statement */}
                            <div className="lg:col-span-7 space-y-4">
                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0f172a] dark:text-white leading-snug max-w-xl">
                                    Together, We Can Build A More Transparent, Compassionate World.
                                </h2>
                                <div className="w-16 h-1 bg-primary rounded-full" />
                            </div>

                            {/* Right Signature */}
                            <div className="lg:col-span-5 flex justify-start lg:justify-end items-center pt-4 lg:pt-0">
                                <div className="relative -rotate-[6deg] select-none">
                                    <p className="font-caveat text-4xl sm:text-5xl lg:text-5xl font-bold text-primary tracking-tight leading-tight">
                                        Radical transparency. <br />
                                        Real impact.
                                    </p>

                                    {/* Brand Green Brush Line */}
                                    <svg width="220" height="24" viewBox="0 0 220 24" fill="none" className="text-primary mt-1 ml-auto">
                                        <path d="M4 14C50 6 150 4 216 14" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            </main>

            {/* Global Public Footer */}
            <Footer />
        </div>
    );
}