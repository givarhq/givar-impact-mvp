import { Skeleton } from '../../../../components/ui/skeleton';

export default function HistoryLoading() {
    return (
        <div className="space-y-4 md:space-y-6 w-full min-w-0 animate-in fade-in duration-500">
            {/* Search & Filters Bar Skeleton */}
            <div className="flex items-center justify-between gap-4 h-11 w-full">
                <div className="flex items-center gap-6 flex-1">
                    <Skeleton className="md:hidden h-7 w-24 shrink-0" />
                    <Skeleton className="hidden md:block h-11 max-w-md flex-1" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-11 w-11 md:hidden" />
                    <div className="hidden md:flex gap-2">
                        <Skeleton className="h-11 w-[130px]" />
                        <Skeleton className="h-11 w-[140px]" />
                        <Skeleton className="h-11 w-24" />
                    </div>
                </div>
            </div>

            {/* Table Skeleton */}
            <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
                <div className="bg-muted/40 border-b border-border/40 p-4 hidden md:flex items-center justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-10" />
                </div>
                <div className="divide-y divide-border/40">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                                <Skeleton className="h-10 w-10 shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-3 w-1/4 md:hidden" />
                                </div>
                            </div>
                            <Skeleton className="hidden md:block h-4 w-32" />
                            <Skeleton className="h-4 w-24 ml-auto md:ml-0" />
                            <Skeleton className="hidden md:block h-5 w-5 rounded-full" />
                            <Skeleton className="hidden md:block h-8 w-20" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}