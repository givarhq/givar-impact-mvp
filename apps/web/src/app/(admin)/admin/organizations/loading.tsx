import { Skeleton } from '../../../../components/ui/skeleton';

export default function AdminOrganizationsLoading() {
    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Search & Filters Row Skeleton */}
            <div className="flex items-center justify-between gap-3 h-10 w-full">
                <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="md:hidden h-7 w-24 shrink-0" />
                    <Skeleton className="hidden md:block h-10 max-w-md flex-1" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 md:hidden" />
                    <div className="hidden md:flex gap-2">
                        <Skeleton className="h-9 w-[160px]" />
                        <Skeleton className="h-9 w-[140px]" />
                        <Skeleton className="h-9 w-20" />
                    </div>
                </div>
            </div>

            {/* Organizations Table Skeleton */}
            <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
                <div className="bg-muted/40 border-b border-border/40 p-5 hidden md:flex justify-between">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-10" />
                </div>
                <div className="divide-y divide-border/40">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="p-4 md:px-6 md:py-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Skeleton className="h-10 w-10 md:h-9 md:w-9 rounded-3xl shrink-0" />
                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                            <div className="hidden md:flex items-center gap-2 flex-1">
                                <Skeleton className="h-7 w-7 rounded-3xl" />
                                <div className="space-y-1">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-2 w-32" />
                                </div>
                            </div>
                            <Skeleton className="hidden md:block h-5 w-12 rounded-3xl" />
                            <Skeleton className="h-6 w-20 rounded-3xl" />
                            <Skeleton className="hidden md:block h-8 w-24 rounded-3xl" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}