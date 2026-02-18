import { Skeleton } from '../../../../components/ui/skeleton';

export default function SettingsLoading() {
    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Tab Navigation Skeleton */}
            <div className="overflow-x-auto no-scrollbar pb-1 hidden md:block">
                <div className="h-11 bg-muted/50 p-1 rounded-3xl w-fit border border-border/40 inline-flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-full w-28 rounded-3xl" />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Profile Card Skeleton */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="rounded-3xl border border-border/40 bg-card overflow-hidden shadow-sm p-6 text-center space-y-4">
                        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32 mx-auto" />
                            <Skeleton className="h-3 w-48 mx-auto" />
                        </div>
                        <div className="flex justify-center gap-2">
                            <Skeleton className="h-6 w-16 rounded-3xl" />
                            <Skeleton className="h-6 w-20 rounded-3xl" />
                        </div>
                    </div>
                    <Skeleton className="h-32 w-full rounded-3xl" />
                </div>

                {/* Content Area Skeleton */}
                <div className="lg:col-span-8 space-y-4">
                    <div className="rounded-3xl border border-border/40 bg-card overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-border/40">
                            <Skeleton className="h-5 w-40" />
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-10 w-full rounded-3xl" />
                                <Skeleton className="h-10 w-full rounded-3xl" />
                            </div>
                            <Skeleton className="h-10 w-full rounded-3xl" />
                            <Skeleton className="h-10 w-full rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}