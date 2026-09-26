import { PublicLayout } from '../../../components/layout/public-layout';
import { Skeleton } from '../../../components/ui/skeleton';

export default function ForCompaniesLoading() {
    return (
        <PublicLayout>
            <div className="w-full min-w-0 overflow-hidden bg-background">
                {/* HERO SKELETON */}
                <section className="relative w-full max-w-7xl mx-auto px-6 sm:px-8 pt-20 sm:pt-24 lg:pt-28 pb-12 lg:pb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
                        <div className="lg:col-span-5 flex flex-col space-y-5 animate-in fade-in duration-500">
                            <Skeleton className="h-4 w-28 rounded-3xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-10 sm:h-12 w-[85%] rounded-3xl" />
                                <Skeleton className="h-10 sm:h-12 w-[65%] rounded-3xl" />
                            </div>
                            <Skeleton className="h-6 w-[75%] rounded-3xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full rounded-3xl" />
                                <Skeleton className="h-4 w-[90%] rounded-3xl" />
                                <Skeleton className="h-4 w-[80%] rounded-3xl" />
                            </div>
                            <div className="pt-1">
                                <Skeleton className="h-12 sm:h-13 w-48 rounded-full" />
                            </div>
                        </div>

                        {/* Wide Landscape Image Skeleton without Card Borders */}
                        <div className="lg:col-span-7 relative flex justify-center lg:justify-end items-center">
                            <Skeleton className="w-full aspect-[16/10] lg:h-[480px] rounded-3xl" />
                        </div>
                    </div>
                </section>

                {/* 4 MINIMALIST STEPS SKELETON */}
                <section className="bg-muted/20 border-t border-border/40 py-16 lg:py-20">
                    <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center space-y-12">
                        <div className="space-y-2 max-w-md mx-auto">
                            <Skeleton className="h-8 sm:h-10 w-full rounded-3xl" />
                            <Skeleton className="h-5 w-3/4 mx-auto rounded-3xl" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 items-start">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex flex-col items-center text-center space-y-3">
                                    <Skeleton className="h-16 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-32 rounded-3xl" />
                                    <div className="space-y-1.5 w-full max-w-[220px]">
                                        <Skeleton className="h-3.5 w-full rounded-3xl" />
                                        <Skeleton className="h-3.5 w-4/5 mx-auto rounded-3xl" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 flex justify-center">
                            <Skeleton className="h-12 w-48 rounded-full" />
                        </div>
                    </div>
                </section>

                {/* CLOSING BANNER SKELETON */}
                <section className="w-full py-20 lg:py-24 max-w-6xl mx-auto px-6 sm:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-7 space-y-4">
                            <Skeleton className="h-8 sm:h-10 w-4/5 rounded-3xl" />
                            <Skeleton className="h-1.5 w-16 rounded-full" />
                        </div>
                        <div className="lg:col-span-5 flex justify-start lg:justify-end">
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-52 rounded-3xl" />
                                <Skeleton className="h-10 w-36 rounded-3xl" />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}