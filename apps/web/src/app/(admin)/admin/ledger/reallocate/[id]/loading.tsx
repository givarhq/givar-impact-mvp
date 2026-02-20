import { Skeleton } from '../../../../../../components/ui/skeleton';

export default function ReallocateLoading() {
    return (
        <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6 pb-32 md:pb-20 animate-in fade-in duration-500">
            {/* Header Context Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-48" />
                    <div className="flex gap-3">
                        <Skeleton className="h-5 w-32 rounded-3xl" />
                        <Skeleton className="h-5 w-40 rounded-3xl" />
                    </div>
                </div>
                <Skeleton className="h-20 w-full md:w-64 rounded-3xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Project Browser Skeleton */}
                <div className="lg:col-span-8 space-y-6">
                    <Skeleton className="h-12 w-full rounded-3xl" />
                    <div className="flex gap-2 overflow-hidden">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-3xl" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="rounded-3xl border border-border/40 bg-card p-4 flex gap-4">
                                <Skeleton className="h-12 w-12 rounded-3xl shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ledger Sticky Sidebar Skeleton */}
                <div className="hidden lg:block lg:col-span-4">
                    <div className="rounded-3xl border border-border/40 bg-card h-[calc(100vh-140px)] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-border/40">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-3 w-32 mt-2" />
                        </div>
                        <div className="flex-1 p-6 space-y-4">
                            {[1, 2].map((i) => (
                                <Skeleton key={i} className="h-32 w-full rounded-3xl" />
                            ))}
                        </div>
                        <div className="p-6 border-t border-border/40 space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-16 w-full rounded-3xl" />
                            <Skeleton className="h-12 w-full rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}