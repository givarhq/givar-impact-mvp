import { Skeleton } from '../../../../components/ui/skeleton';

export default function FinancesLoading() {
    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Filter Bar Skeleton */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <Skeleton className="h-11 w-full lg:w-[320px] rounded-3xl" />
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <Skeleton className="h-11 w-32 rounded-3xl" />
                    <Skeleton className="h-11 flex-1 lg:w-40 rounded-3xl" />
                </div>
            </div>

            {/* KPI Card Grid Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-[28px]" />
                ))}
            </div>

            {/* Charts / Leaderboard Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-[480px] w-full rounded-3xl" />
                <Skeleton className="h-[480px] w-full rounded-3xl" />
                <Skeleton className="lg:col-span-2 h-[300px] w-full rounded-3xl" />
            </div>
        </div>
    );
}