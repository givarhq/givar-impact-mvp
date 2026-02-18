import { Skeleton } from '../../../../components/ui/skeleton';

export default function VerificationsLoading() {
    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Evidence Filters Skeleton */}
            <div className="flex items-center justify-between gap-3 h-10 w-full">
                <Skeleton className="hidden md:block h-10 max-w-md flex-1" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 md:hidden" />
                    <div className="hidden md:flex gap-2">
                        <Skeleton className="h-9 w-[160px]" />
                        <Skeleton className="h-9 w-20" />
                    </div>
                </div>
            </div>

            {/* Tabs List Skeleton */}
            <Skeleton className="h-12 w-full md:w-[400px] rounded-3xl" />

            {/* Evidence Queue Table Skeleton */}
            <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
                <div className="bg-muted/40 border-b border-border/40 p-4 hidden md:flex items-center justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="divide-y divide-border/40">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-4 md:px-6 md:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <Skeleton className="h-4 w-4 hidden md:block" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-6 w-24 rounded-3xl" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-24 hidden md:block" />
                            <Skeleton className="h-7 w-20 rounded-3xl" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}