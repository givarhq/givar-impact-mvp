import { Skeleton } from '../../../../components/ui/skeleton';

export default function ImpactFeedLoading() {
    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300 pb-20">
            {/* Search & Filters Skeleton */}
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 h-[44px]">
                    <Skeleton className="hidden md:block h-11 max-w-md flex-1" />
                    <div className="flex gap-2">
                        <Skeleton className="h-11 w-11 md:hidden" />
                        <Skeleton className="h-11 w-[160px] hidden md:block" />
                    </div>
                </div>

                {/* Category Browser Skeleton */}
                <div className="flex gap-2 overflow-hidden pb-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Skeleton key={i} className="h-9 w-32 shrink-0" />
                    ))}
                </div>
            </div>

            {/* Discovery Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div key={i} className="rounded-3xl border border-border/40 p-4 space-y-4 bg-card shadow-sm">
                        <Skeleton className="aspect-video w-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-10" />
                            </div>
                            <Skeleton className="h-1.5 w-full rounded-full" />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Skeleton className="h-9 flex-1" />
                            <Skeleton className="h-9 w-9" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}