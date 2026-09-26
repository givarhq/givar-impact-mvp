import { Skeleton } from '../../../components/ui/skeleton';
import { LandingHeader } from '../../../components/layout/landing-header';
import { Footer } from '../../../components/layout/footer';

export default function ForCompaniesLoading() {
    return (
        <div className="min-h-screen w-full bg-[#fbfdfc] dark:bg-background text-foreground font-sans overflow-x-hidden">
            <LandingHeader />

            <main className="w-full">
                {/* HERO SKELETON */}
                <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 pt-20 sm:pt-24 lg:pt-28 pb-12 lg:pb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">

                        {/* Left Column Skeleton */}
                        <div className="lg:col-span-5 flex flex-col space-y-5 z-10 animate-in fade-in duration-500">
                            <Skeleton className="h-4 w-28 rounded-3xl" />

                            <div className="space-y-2">
                                <Skeleton className="h-10 sm:h-12 lg:h-14 w-[85%] rounded-3xl" />
                                <Skeleton className="h-10 sm:h-12 lg:h-14 w-[70%] rounded-3xl" />
                            </div>

                            <Skeleton className="h-6 sm:h-7 w-[90%] rounded-2xl" />

                            <div className="space-y-2 max-w-xl">
                                <Skeleton className="h-4 w-full rounded-xl" />
                                <Skeleton className="h-4 w-[92%] rounded-xl" />
                                <Skeleton className="h-4 w-[85%] rounded-xl" />
                            </div>

                            <div className="pt-1 space-y-3">
                                <Skeleton className="h-12 sm:h-13 w-48 rounded-full" />
                                <Skeleton className="h-4 w-40 rounded-xl" />
                            </div>
                        </div>

                        {/* Right Column Landscape Image Skeleton */}
                        <div className="lg:col-span-7 relative flex justify-center lg:justify-end items-center">
                            <div className="relative w-full aspect-[16/10] sm:aspect-[16/10] lg:h-[480px] overflow-hidden">
                                <Skeleton className="w-full h-full" />
                            </div>
                        </div>

                    </div>
                </section>

                {/* SECTION 2: 4 MINIMALIST STEPS SKELETON */}
                <section className="w-full bg-[#f8fafc] dark:bg-zinc-950/40 py-16 lg:py-20 border-t border-border/40">
                    <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center space-y-12">

                        <div className="space-y-2">
                            <Skeleton className="h-9 sm:h-11 lg:h-12 w-3/4 max-w-md mx-auto rounded-3xl" />
                            <Skeleton className="h-5 sm:h-6 w-1/2 max-w-xs mx-auto rounded-2xl" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 relative items-start">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex flex-col items-center text-center space-y-3">
                                    <Skeleton className="h-16 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-32 rounded-2xl" />
                                    <div className="space-y-1.5 w-full max-w-[220px]">
                                        <Skeleton className="h-3.5 w-full rounded-xl" />
                                        <Skeleton className="h-3.5 w-4/5 mx-auto rounded-xl" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 flex justify-center">
                            <Skeleton className="h-12 w-48 rounded-full" />
                        </div>

                    </div>
                </section>

                {/* SECTION 3: CLOSING SKELETON */}
                <section className="relative w-full bg-white dark:bg-background overflow-hidden py-20 lg:py-24">
                    <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                            <div className="lg:col-span-7 space-y-4">
                                <Skeleton className="h-8 sm:h-10 lg:h-12 w-4/5 max-w-xl rounded-3xl" />
                                <Skeleton className="h-1.5 w-16 rounded-full" />
                            </div>

                            <div className="lg:col-span-5 flex justify-start lg:justify-end items-center pt-2 lg:pt-0">
                                <div className="space-y-2">
                                    <Skeleton className="h-10 sm:h-12 w-52 rounded-2xl" />
                                    <Skeleton className="h-10 sm:h-12 w-36 rounded-2xl" />
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}