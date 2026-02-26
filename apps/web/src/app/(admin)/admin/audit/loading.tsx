import { Skeleton } from '../../../../components/ui/skeleton';

export default function AuditLoading() {
    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Search & Filters Skeleton */}
            <div className="flex items-center justify-between gap-3 h-10 w-full">
                <Skeleton className="hidden md:block h-10 max-w-md flex-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 md:hidden" />
                    <div className="hidden md:flex gap-2">
                        <Skeleton className="h-9 w-[300px]" />
                        <Skeleton className="h-9 w-[180px]" />
                        <Skeleton className="h-9 w-20" />
                    </div>
                </div>
            </div>

            {/* Audit Summary Stat Grid Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 w-full">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-3xl" />
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
                <div className="bg-muted/40 border-b border-border/40 p-4 hidden md:flex items-center justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="divide-y divide-border/40">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="p-4 md:px-6 md:py-4 flex items-center justify-between gap-4">
                            <Skeleton className="h-4 w-4 hidden md:block" />
                            <div className="flex items-center gap-3 flex-1">
                                <Skeleton className="h-8 w-8 rounded-3xl shrink-0" />
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-32 rounded-3xl" />
                            <Skeleton className="hidden md:block h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}