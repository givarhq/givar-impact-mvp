import { PublicLayout } from '../../../components/layout/public-layout';
import { Skeleton } from '../../../components/ui/skeleton';

export default function PublicExploreLoading() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-8 space-y-10 min-h-screen pb-24">
                {/* Header Filter Row Skeleton */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between gap-4 h-[44px]">
                        <Skeleton className="hidden md:block h-11 max-w-md flex-1" />
                        <div className="flex gap-2">
                            <Skeleton className="h-11 w-11 md:hidden" />
                            <Skeleton className="h-11 w-[160px] hidden md:block" />
                        </div>
                    </div>

                    {/* Category Carousel Skeleton */}
                    <div className="flex gap-2 overflow-hidden pb-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <Skeleton key={i} className="h-10 w-36 shrink-0 rounded-3xl" />
                        ))}
                    </div>
                </div>

                {/* Discovery Grid Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="group flex flex-row sm:flex-col rounded-3xl bg-card border border-border/40 shadow-sm h-full overflow-hidden">
                            {/* Visual Header Skeleton: Fixed width on mobile, full width on desktop */}
                            <Skeleton className="w-[110px] sm:w-full shrink-0 sm:aspect-video rounded-none border-r sm:border-r-0 sm:border-b border-border/40" />

                            {/* Content Body Skeleton */}
                            <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between min-w-0 gap-2 sm:gap-3">
                                <div className="space-y-2 sm:space-y-3 min-w-0">
                                    <Skeleton className="h-4 w-3/4 rounded-md" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-3 w-16 rounded-md" />
                                        <Skeleton className="h-3 w-20 rounded-md" />
                                    </div>
                                </div>

                                {/* Progress & Actions Skeleton */}
                                <div className="space-y-2 sm:space-y-3 mt-auto min-w-0 pt-2">
                                    <div className="flex justify-between items-end gap-3 min-w-0">
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex justify-between items-end min-w-0">
                                                <Skeleton className="h-3 w-16 rounded-md" />
                                                <Skeleton className="h-3 w-8 rounded-md" />
                                            </div>
                                            <Skeleton className="h-1.5 w-full rounded-full" />
                                        </div>
                                        <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-full shrink-0" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}