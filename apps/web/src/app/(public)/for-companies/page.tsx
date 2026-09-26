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
});

export const metadata: Metadata = {
    title: 'For Companies',
    description: 'Turn your CSR budget into verified, transparent impact.',
};

export default function ForCompaniesPage() {
    return (
        <div className="min-h-screen w-full bg-[#fbfdfc] dark:bg-background text-foreground font-sans selection:bg-primary/20 overflow-x-hidden">
            <LandingHeader />

            <main className="w-full">
                {/* HERO SECTION */}
                <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 pt-20 sm:pt-24 lg:pt-28 pb-12 lg:pb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">

                        {/* Left Content Column */}
                        <div className="lg:col-span-5 flex flex-col space-y-5 z-10">
                            <span className="text-xs sm:text-sm font-black tracking-widest text-primary uppercase">
                                For Companies
                            </span>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0f172a] dark:text-white leading-[1.08]">
                                Let Givar be <br />
                                your <span className="text-primary">CSR engine.</span>
                            </h1>

                            <p className="text-lg sm:text-xl font-bold text-[#1e293b] dark:text-zinc-100 leading-snug">
                                Turn your CSR budget into verified, transparent impact.
                            </p>

                            <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed max-w-xl">
                                Givar finds and verifies genuine needs, facilitates payments directly to trusted providers, and documents the outcome, giving your organisation a simple and credible way to make a real difference.
                            </p>

                            <div className="pt-1 space-y-3">
                                <Link href="/for-companies/partner">
                                    <Button className="h-12 sm:h-13 px-8 rounded-full font-bold text-sm sm:text-base bg-primary hover:bg-primary/90 text-white shadow-md active:scale-95 transition-all border-0">
                                        Partner with Givar <ArrowRight className="ml-2 h-4 w-4 stroke-[2.5]" />
                                    </Button>
                                </Link>

                                <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                                    Real needs. Real people. Real impact.
                                </p>
                            </div>
                        </div>

                        {/* Right Visual Column (Wide landscape format with blended left gradient edge) */}
                        <div className="lg:col-span-7 relative flex justify-center lg:justify-end items-center">
                            <div
                                className="relative w-full aspect-[16/10] sm:aspect-[16/10] lg:h-[480px] overflow-hidden"
                                style={{
                                    WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 65% 50%, black 60%, transparent 100%)',
                                    maskImage: 'radial-gradient(ellipse 90% 85% at 65% 50%, black 60%, transparent 100%)',
                                }}
                            >
                                {/* Seamless Left Fade Overlay */}
                                <div className="hidden lg:block absolute inset-y-0 left-0 w-36 bg-gradient-to-r from-[#fbfdfc] dark:from-background to-transparent z-10 pointer-events-none" />

                                {/* Handwritten Annotation in top-left with heart on top of curved underline */}
                                <div className="absolute top-3 left-3 sm:top-5 sm:left-6 z-20 pointer-events-none select-none text-left -rotate-[5deg] inline-flex flex-col items-start">
                                    <p className={`${caveat.className} text-xl sm:text-2xl font-bold text-[#064e3b] dark:text-emerald-400 leading-tight`}>
                                        A brighter <br />
                                        tomorrow <br />
                                        is possible.
                                    </p>

                                    {/* Heart on top with curved underline directly below */}
                                    <div className="flex flex-col items-center w-full max-w-[110px] mt-1 text-primary">
                                        <svg width="22" height="18" viewBox="0 0 40 36" fill="none" className="stroke-current stroke-[2.5]">
                                            <path d="M20 32C20 32 4 22 4 11C4 5 8.5 2 13.5 2C17 2 19 4 20 6C21 4 23 2 26.5 2C31.5 2 36 5 36 11C36 22 20 32 20 32Z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>

                                        {/* Curved brand green underline */}
                                        <svg width="74" height="12" viewBox="0 0 74 12" fill="none" className="text-primary -mt-0.5">
                                            <path d="M3 9C20 3 54 3 71 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Main Girl Image */}
                                <Image
                                    src="/For-Companies-Image.png"
                                    alt="A young school student smiling in a classroom"
                                    fill
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 750px"
                                    className="object-cover object-center"
                                />
                            </div>
                        </div>

                    </div>
                </section>

                {/* SECTION 2: 4 MINIMALIST CONNECTED STEPS */}
                <section className="w-full bg-[#f8fafc] dark:bg-zinc-950/40 py-16 lg:py-20 border-t border-border/40">
                    <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center space-y-12">

                        <div className="space-y-2">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0f172a] dark:text-white">
                                Your CSR. <span className="text-primary">Powered by Givar.</span>
                            </h2>
                            <p className="text-base sm:text-lg font-bold text-muted-foreground">
                                You provide the funding. We handle the work.
                            </p>
                        </div>

                        {/* 4 Connected Minimalist Steps with Green Circular Badges & Directional Arrows */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 relative items-start">

                            {/* Step 1 */}
                            <div className="flex flex-col items-center text-center space-y-3 relative group">
                                <div className="h-16 w-16 rounded-full bg-primary/15 text-primary flex items-center justify-center shadow-sm">
                                    <FileText className="h-8 w-8 stroke-[2.2]" />
                                </div>

                                <div className="hidden lg:block absolute top-8 left-[calc(50%+45px)] right-[calc(-50%+45px)] z-0 pointer-events-none">
                                    <ArrowRight className="h-5 w-5 text-primary mx-auto stroke-[2.5]" />
                                </div>

                                <h3 className="text-base font-bold text-[#0f172a] dark:text-white pt-1">
                                    1. You set your focus
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed max-w-[220px]">
                                    Tell us your budget and the causes you care about.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center text-center space-y-3 relative group">
                                <div className="h-16 w-16 rounded-full bg-primary/15 text-primary flex items-center justify-center shadow-sm">
                                    <Users className="h-8 w-8 stroke-[2.2]" />
                                </div>

                                <div className="hidden lg:block absolute top-8 left-[calc(50%+45px)] right-[calc(-50%+45px)] z-0 pointer-events-none">
                                    <ArrowRight className="h-5 w-5 text-primary mx-auto stroke-[2.5]" />
                                </div>

                                <h3 className="text-base font-bold text-[#0f172a] dark:text-white pt-1">
                                    2. We find and verify
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed max-w-[220px]">
                                    We source and verify genuine needs with supporting evidence.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center text-center space-y-3 relative group">
                                <div className="h-16 w-16 rounded-full bg-primary/15 text-primary flex items-center justify-center shadow-sm">
                                    <Heart className="h-8 w-8 stroke-[2.2]" />
                                </div>

                                <div className="hidden lg:block absolute top-8 left-[calc(50%+45px)] right-[calc(-50%+45px)] z-0 pointer-events-none">
                                    <ArrowRight className="h-5 w-5 text-primary mx-auto stroke-[2.5]" />
                                </div>

                                <h3 className="text-base font-bold text-[#0f172a] dark:text-white pt-1">
                                    3. You support
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed max-w-[220px]">
                                    Select causes to fund.
                                </p>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col items-center text-center space-y-3 relative group">
                                <div className="h-16 w-16 rounded-full bg-primary/15 text-primary flex items-center justify-center shadow-sm">
                                    <BarChart3 className="h-8 w-8 stroke-[2.2]" />
                                </div>

                                <h3 className="text-base font-bold text-[#0f172a] dark:text-white pt-1">
                                    4. See the impact
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed max-w-[220px]">
                                    We track the funding and document the outcome, so you can see the real difference your support made.
                                </p>
                            </div>

                        </div>

                        {/* Centered Action Button */}
                        <div className="pt-4">
                            <Link href="/for-companies/partner">
                                <Button className="h-12 px-8 rounded-full font-bold text-sm bg-primary hover:bg-primary/90 text-white shadow-md active:scale-95 transition-all border-0">
                                    Partner with Givar <ArrowRight className="ml-2 h-4 w-4 stroke-[2.5]" />
                                </Button>
                            </Link>
                        </div>

                    </div>
                </section>

                {/* SECTION 3: CLOSING SECTION (Untouched as requested) */}
                <section className="relative w-full bg-white dark:bg-background overflow-hidden py-20 lg:py-24">

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
                                    Together, we can build a more transparent, compassionate world.
                                </h2>
                                <div className="w-16 h-1 bg-primary rounded-full" />
                            </div>

                            {/* Right Signature - Emerald text with accurately aligned brand green underline */}
                            <div className="lg:col-span-5 flex justify-start lg:justify-end items-center pt-2 lg:pt-0">
                                <div className="relative -rotate-[6deg] select-none inline-flex flex-col">
                                    <p className={`${caveat.className} text-4xl sm:text-5xl font-bold text-[#064e3b] dark:text-emerald-400 tracking-tight leading-tight`}>
                                        Radical transparency. <br />
                                        Real impact.
                                    </p>

                                    {/* Brand Green Brush Line directly under the text */}
                                    <svg width="210" height="20" viewBox="0 0 210 20" fill="none" className="text-primary mt-1">
                                        <path d="M4 12C50 4 140 4 206 12" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            </main>

            {/* Standard Public Footer */}
            <Footer />
        </div>
    );
}