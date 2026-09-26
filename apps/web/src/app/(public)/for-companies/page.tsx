import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Caveat } from 'next/font/google';
import { ArrowRight, FileText, Users, Heart, BarChart3, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { LandingHeader } from '../../../components/layout/landing-header';
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

export default function ForCompaniesPage() {
    return (
        <div className={`min-h-screen w-full bg-[#fbfdfc] dark:bg-background text-foreground font-sans ${caveat.variable} selection:bg-primary/20 overflow-x-hidden`}>
            <LandingHeader />

            <main className="w-full">
                {/* HERO SECTION */}
                <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 pt-28 sm:pt-36 lg:pt-36 pb-16 lg:pb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">

                        {/* Left Content Column */}
                        <div className="lg:col-span-6 flex flex-col space-y-6 z-10">
                            <span className="text-xs sm:text-sm font-black tracking-widest text-[#059669] uppercase">
                                FOR COMPANIES
                            </span>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0f172a] dark:text-white leading-[1.08]">
                                Let Givar be <br />
                                your <span className="text-[#059669]">CSR engine.</span>
                            </h1>

                            <p className="text-lg sm:text-xl font-bold text-[#1e293b] dark:text-zinc-100 leading-snug">
                                Turn your CSR budget into verified, transparent impact.
                            </p>

                            <p className="text-sm sm:text-base text-[#475569] dark:text-zinc-400 font-medium leading-relaxed max-w-xl">
                                Givar finds and verifies genuine needs, facilitates payments directly to trusted providers, and documents the outcome, giving your organisation a simple and credible way to make a real difference.
                            </p>

                            <div className="pt-2 space-y-4">
                                <Link href="/for-companies/partner">
                                    <Button className="h-12 sm:h-13 px-8 rounded-full font-bold text-sm sm:text-base bg-[#059669] hover:bg-[#047857] text-white shadow-md active:scale-95 transition-all border-0">
                                        Partner with Givar <ArrowRight className="ml-2 h-4 w-4 stroke-[2.5]" />
                                    </Button>
                                </Link>

                                <p className="text-xs sm:text-sm font-semibold text-[#64748b] dark:text-zinc-500">
                                    Real needs. Real people. Real impact.
                                </p>
                            </div>
                        </div>

                        {/* Right Visual Column */}
                        <div className="lg:col-span-6 relative flex justify-center lg:justify-end items-center">
                            <div className="relative w-full max-w-[560px] aspect-[4/3] sm:aspect-[16/12] lg:h-[480px] rounded-3xl overflow-visible">
                                {/* Handwritten Floating Annotation */}
                                <div className="absolute -top-12 right-2 sm:right-6 z-20 pointer-events-none select-none text-right">
                                    <p className="font-caveat text-3xl sm:text-4xl font-bold text-[#065f46] leading-tight rotate-[6deg]">
                                        A brighter <br />
                                        tomorrow <br />
                                        is possible.
                                    </p>
                                    <div className="flex justify-end items-center mt-1 mr-4">
                                        <svg width="34" height="30" viewBox="0 0 40 36" fill="none" className="text-[#059669] stroke-current stroke-[2.5]">
                                            <path d="M20 32C20 32 4 22 4 11C4 5 8.5 2 13.5 2C17 2 19 4 20 6C21 4 23 2 26.5 2C31.5 2 36 5 36 11C36 22 20 32 20 32Z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div className="w-16 h-1 bg-[#059669] rounded-full ml-auto mt-2 -rotate-[6deg]" />
                                </div>

                                {/* Girl Photo Container */}
                                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-muted border border-black/5">
                                    <Image
                                        src="/For-Companies-Image.png"
                                        alt="A young school student smiling in a classroom"
                                        fill
                                        priority
                                        sizes="(max-width: 1024px) 100vw, 560px"
                                        className="object-cover object-center"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* SECTION 2: PROCESS FLOW ("Your CSR. Powered by Givar.") */}
                <section className="w-full bg-[#f8fafc] dark:bg-zinc-950/40 py-20 lg:py-24 border-t border-border/40">
                    <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center space-y-14">

                        <div className="space-y-3">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0f172a] dark:text-white">
                                Your CSR. <span className="text-[#059669]">Powered by Givar.</span>
                            </h2>
                            <p className="text-base sm:text-lg font-bold text-[#475569] dark:text-zinc-400">
                                You provide the funding. We handle the work.
                            </p>
                        </div>

                        {/* 4 Connected Minimalist Steps (No Boxed Cards) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 relative items-start">

                            {/* Step 1 */}
                            <div className="flex flex-col items-center text-center space-y-3 relative group">
                                <div className="relative flex items-center justify-center">
                                    <div className="h-16 w-16 rounded-full bg-[#dcfce7] text-[#059669] flex items-center justify-center shadow-sm">
                                        <FileText className="h-8 w-8 stroke-[2.2]" />
                                    </div>
                                </div>

                                <div className="hidden lg:block absolute top-8 left-[calc(50%+45px)] right-[calc(-50%+45px)] z-0 pointer-events-none">
                                    <ArrowRight className="h-6 w-6 text-[#059669] mx-auto stroke-[2.5]" />
                                </div>

                                <h3 className="text-base font-bold text-[#0f172a] dark:text-white pt-1">
                                    1. You set your focus
                                </h3>
                                <p className="text-xs sm:text-sm text-[#475569] dark:text-zinc-400 font-medium leading-relaxed max-w-[220px]">
                                    Tell us your budget and the causes you care about.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center text-center space-y-3 relative group">
                                <div className="relative flex items-center justify-center">
                                    <div className="h-16 w-16 rounded-full bg-[#dcfce7] text-[#059669] flex items-center justify-center shadow-sm">
                                        <Users className="h-8 w-8 stroke-[2.2]" />
                                    </div>
                                </div>

                                <div className="hidden lg:block absolute top-8 left-[calc(50%+45px)] right-[calc(-50%+45px)] z-0 pointer-events-none">
                                    <ArrowRight className="h-6 w-6 text-[#059669] mx-auto stroke-[2.5]" />
                                </div>

                                <h3 className="text-base font-bold text-[#0f172a] dark:text-white pt-1">
                                    2. We find and verify
                                </h3>
                                <p className="text-xs sm:text-sm text-[#475569] dark:text-zinc-400 font-medium leading-relaxed max-w-[220px]">
                                    We source and verify genuine needs with supporting evidence.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center text-center space-y-3 relative group">
                                <div className="relative flex items-center justify-center">
                                    <div className="h-16 w-16 rounded-full bg-[#dcfce7] text-[#059669] flex items-center justify-center shadow-sm">
                                        <Heart className="h-8 w-8 stroke-[2.2]" />
                                    </div>
                                </div>

                                <div className="hidden lg:block absolute top-8 left-[calc(50%+45px)] right-[calc(-50%+45px)] z-0 pointer-events-none">
                                    <ArrowRight className="h-6 w-6 text-[#059669] mx-auto stroke-[2.5]" />
                                </div>

                                <h3 className="text-base font-bold text-[#0f172a] dark:text-white pt-1">
                                    3. You support
                                </h3>
                                <p className="text-xs sm:text-sm text-[#475569] dark:text-zinc-400 font-medium leading-relaxed max-w-[220px]">
                                    Select causes to fund.
                                </p>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col items-center text-center space-y-3 relative group">
                                <div className="relative flex items-center justify-center">
                                    <div className="h-16 w-16 rounded-full bg-[#dcfce7] text-[#059669] flex items-center justify-center shadow-sm">
                                        <BarChart3 className="h-8 w-8 stroke-[2.2]" />
                                    </div>
                                </div>

                                <h3 className="text-base font-bold text-[#0f172a] dark:text-white pt-1">
                                    4. See the impact
                                </h3>
                                <p className="text-xs sm:text-sm text-[#475569] dark:text-zinc-400 font-medium leading-relaxed max-w-[220px]">
                                    We track the funding and document the outcome, so you can see the real difference your support made.
                                </p>
                            </div>

                        </div>

                        {/* Centered Action Button */}
                        <div className="pt-6">
                            <Link href="/for-companies/partner">
                                <Button className="h-12 px-8 rounded-full font-bold text-sm bg-[#059669] hover:bg-[#047857] text-white shadow-md active:scale-95 transition-all border-0">
                                    Partner with Givar <ArrowRight className="ml-2 h-4 w-4 stroke-[2.5]" />
                                </Button>
                            </Link>
                        </div>

                    </div>
                </section>

                {/* SECTION 3: CLOSING SECTION WITH MINT WAVE BANNER */}
                <section className="relative w-full bg-white dark:bg-background overflow-hidden py-24 lg:py-28">
                    {/* Organic Mint Wave Curved Backdrop */}
                    <div className="absolute inset-0 pointer-events-none">
                        <svg
                            className="w-full h-full object-cover"
                            viewBox="0 0 1440 380"
                            fill="none"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M0 320C320 380 720 280 1440 120V380H0V320Z"
                                fill="#dcfce7"
                                fillOpacity="0.45"
                            />
                            <path
                                d="M0 240C400 360 920 200 1440 80V380H0V240Z"
                                fill="#dcfce7"
                                fillOpacity="0.25"
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
                                <div className="w-16 h-1 bg-[#059669] rounded-full" />
                            </div>

                            {/* Right Angled Handwritten Signature */}
                            <div className="lg:col-span-5 flex justify-start lg:justify-end items-center pt-4 lg:pt-0">
                                <div className="relative -rotate-[6deg] select-none">
                                    <p className="font-caveat text-4xl sm:text-5xl lg:text-5xl font-bold text-[#064e3b] dark:text-emerald-400 tracking-tight leading-tight">
                                        Radical transparency. <br />
                                        Real impact.
                                    </p>
                                    {/* Thick Curved Green Brush Line Underneath */}
                                    <svg width="220" height="24" viewBox="0 0 220 24" fill="none" className="text-[#059669] mt-1 ml-auto">
                                        <path d="M4 14C50 6 150 4 216 14" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="w-full bg-white dark:bg-background border-t border-border/40 py-12 px-6 sm:px-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">

                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group">
                            <Image src="/Givar1.png" alt="Givar Logo" width={28} height={28} className="object-contain" />
                            <span className="text-xl font-bold text-foreground">Givar.</span>
                        </Link>

                        {/* Nav Links */}
                        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-[#475569] dark:text-zinc-400">
                            <Link href="/explore" className="hover:text-primary transition-colors">Explore Causes</Link>
                            <Link href="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
                            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
                            <Link href="/for-companies" className="text-primary font-bold hover:text-primary transition-colors">For Companies</Link>
                        </div>

                        {/* Social Icons */}
                        <div className="flex items-center gap-4 text-[#475569] dark:text-zinc-400">
                            <a href="https://instagram.com/givar.app" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <Instagram className="h-4 w-4 hover:text-primary transition-colors" />
                            </a>
                            <a href="https://linkedin.com/company/givar" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                <Linkedin className="h-4 w-4 hover:text-primary transition-colors" />
                            </a>
                            <a href="https://x.com/givarapp" target="_blank" rel="noopener noreferrer" aria-label="X">
                                <Twitter className="h-4 w-4 hover:text-primary transition-colors" />
                            </a>
                            <a href="https://youtube.com/@givarapp" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                <Youtube className="h-4 w-4 hover:text-primary transition-colors" />
                            </a>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-border/30 text-xs font-medium text-[#64748b]">
                        <p>© 2026 Givar. All rights reserved.</p>
                        <div className="flex items-center gap-4">
                            <Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                            <Link href="/legal/terms" className="hover:text-primary transition-colors">Terms</Link>
                            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}