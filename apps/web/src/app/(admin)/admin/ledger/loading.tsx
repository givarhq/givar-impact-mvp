import { Skeleton } from '../../../../components/ui/skeleton';

export default function LedgerLoading() {
    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Tabs Switcher Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="h-11 bg-muted/50 p-1 rounded-3xl w-full md:w-fit border border-border/50 inline-flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-full w-32 rounded-3xl" />
                    ))}
                </div>
            </div>

            {/* Suspense Queue List Skeleton */}
            <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-3xl border border-border/50 bg-card overflow-hidden">
                        <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5 flex-1 w-full">
                                <Skeleton className="h-14 w-14 rounded-3xl shrink-0" />
                                <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <Skeleton className="h-8 w-40" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Skeleton className="h-11 flex-1 md:w-28 rounded-3xl" />
                                <Skeleton className="h-11 flex-1 md:w-32 rounded-3xl" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}