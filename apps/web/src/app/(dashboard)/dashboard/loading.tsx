import { Skeleton } from '../../../components/ui/skeleton';

export default function DashboardLoading() {
    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Hero Section Skeleton */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-32" />
                        <div className="h-1 w-1 rounded-full bg-border" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <Skeleton className="h-11 w-full md:w-[280px]" />
            </div>

            {/* Overview Cards Skeleton */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-12">
                <Skeleton className="lg:col-span-7 xl:col-span-8 h-[200px] md:h-[220px]" />
                <Skeleton className="lg:col-span-5 xl:col-span-4 h-[200px] md:h-[220px]" />
            </div>

            {/* Discovery Section Skeleton */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 px-1">
                    <Skeleton className="h-9 w-9 rounded-3xl" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>

                {/* Category Browser Skeleton */}
                <div className="flex gap-2 overflow-hidden pb-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-9 w-28 shrink-0" />
                    ))}
                </div>

                {/* Project Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="aspect-video w-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-9 flex-1" />
                                <Skeleton className="h-9 w-9" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}