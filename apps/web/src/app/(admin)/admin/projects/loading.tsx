import { Skeleton } from '../../../../components/ui/skeleton';

export default function AdminProjectsLoading() {
    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Filter Bar Skeleton */}
            <div className="flex items-center justify-between gap-3 h-10 w-full">
                <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="md:hidden h-6 w-20 shrink-0" />
                    <Skeleton className="hidden md:flex h-10 max-w-md flex-1" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 md:hidden" />
                    <div className="hidden md:flex gap-2">
                        <Skeleton className="h-9 w-[120px]" />
                        <Skeleton className="h-9 w-[140px]" />
                    </div>
                </div>
            </div>

            <div className="space-y-6 w-full">
                {/* Tab and Action Bar Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Skeleton className="h-12 w-full md:w-[380px]" />
                    <Skeleton className="h-12 w-full md:w-[160px]" />
                </div>

                {/* Table Skeleton */}
                <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
                    <div className="bg-muted/40 border-b border-border/40 p-5 hidden md:flex justify-between">
                        <Skeleton className="h-4 w-6" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-8" />
                    </div>
                    <div className="divide-y divide-border/40">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="p-4 md:px-5 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <Skeleton className="h-4 w-4 hidden md:block" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:contents">
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="hidden md:block h-4 w-24" />
                                    <Skeleton className="h-10 w-24 md:h-10 md:w-32" />
                                    <Skeleton className="h-8 w-8 md:h-8 md:w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}