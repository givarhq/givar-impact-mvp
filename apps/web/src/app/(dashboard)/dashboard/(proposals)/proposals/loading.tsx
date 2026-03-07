import { Skeleton } from '../../../../../components/ui/skeleton';

export default function ProposalsLoading() {
    return (
        <div className="space-y-4 md:space-y-6 w-full min-w-0 animate-in fade-in duration-500">
            {/* Synchronized Header Skeleton */}
            <div className="flex items-center justify-between gap-4 px-1 min-w-0">
                <div className="space-y-2 min-w-0">
                    <Skeleton className="h-7 w-32 md:h-9 md:w-48 rounded-3xl" />
                    <Skeleton className="hidden md:block h-5 w-80 rounded-3xl" />
                </div>
                <Skeleton className="h-10 md:h-12 w-24 md:w-[160px] rounded-3xl shrink-0" />
            </div>

            {/* Proposal Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="rounded-3xl border border-border/40 bg-card p-5 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-6 w-24 rounded-3xl" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-5 w-20 rounded-3xl" />
                            <Skeleton className="h-5 w-24 rounded-3xl" />
                        </div>
                        <div className="pt-4 border-t border-border/40">
                            <Skeleton className="h-10 w-full rounded-3xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}