import { Skeleton } from '../../../../../components/ui/skeleton';

export default function ProposalsLoading() {
    return (
        <div className="space-y-4 md:space-y-6 w-full min-w-0 animate-in fade-in duration-500">
            {/* Mobile Title Skeleton */}
            <Skeleton className="md:hidden h-7 w-32 ml-1" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Skeleton className="hidden md:block h-5 w-80 rounded-3xl" />
                <Skeleton className="h-12 w-full md:w-[160px] rounded-3xl" />
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