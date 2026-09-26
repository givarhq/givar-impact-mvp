import { PublicLayout } from '../../../components/layout/public-layout';
import { Skeleton } from '../../../components/ui/skeleton';

export default function ForCompaniesLoading() {
    return (
        <PublicLayout>
            <div className="w-full min-w-0 overflow-hidden bg-background">
                {/* HERO SKELETON */}
                <section className="relative w-full max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20 lg:pb-32">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                        <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-32 rounded-3xl" />
                                <div className="space-y-2 mt-4 mb-6">
                                    <Skeleton className="h-12 md:h-16 w-[90%] rounded-3xl" />
                                    <Skeleton className="h-12 md:h-16 w-[70%] rounded-3xl" />
                                </div>
                                <Skeleton className="h-8 w-[80%] rounded-3xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full rounded-3xl" />
                                    <Skeleton className="h-4 w-[90%] rounded-3xl" />
                                    <Skeleton className="h-4 w-[85%] rounded-3xl" />
                                </div>
                            </div>
                            <div className="pt-2">
                                <Skeleton className="h-14 w-[220px] rounded-full" />
                            </div>
                        </div>
                        <div className="w-full aspect-[4/3] lg:aspect-auto lg:h-[600px] rounded-[32px] overflow-hidden bg-muted animate-pulse border border-border/40" />
                    </div>
                </section>

                {/* HOW IT WORKS SKELETON */}
                <section className="bg-muted/20 border-t border-border/40 py-20 lg:py-32">
                    <div className="max-w-7xl mx-auto px-6 animate-in fade-in duration-500">
                        <div className="text-center space-y-4 mb-16">
                            <Skeleton className="h-10 w-[80%] max-w-[500px] mx-auto rounded-3xl" />
                            <Skeleton className="h-6 w-[60%] max-w-[300px] mx-auto rounded-3xl" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="rounded-3xl border border-border/40 bg-card p-6 md:p-8 space-y-5 h-[240px]">
                                    <Skeleton className="h-14 w-14 rounded-2xl" />
                                    <Skeleton className="h-6 w-[80%] rounded-3xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-3 w-full rounded-3xl" />
                                        <Skeleton className="h-3 w-[90%] rounded-3xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}