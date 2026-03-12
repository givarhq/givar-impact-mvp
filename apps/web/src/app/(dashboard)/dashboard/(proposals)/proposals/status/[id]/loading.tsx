import { Skeleton } from '../../../../../../../components/ui/skeleton';

export default function ProposalStatusLoading() {
    return (
        <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-4 px-1 min-w-0">
                <Skeleton className="h-8 w-32 rounded-3xl" />

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 min-w-0">
                    <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-8 w-64 rounded-3xl" />
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-24 rounded-3xl" />
                            <Skeleton className="h-5 w-20 rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start min-w-0">
                {/* Main Content Skeleton */}
                <div className="lg:col-span-8 space-y-6 min-w-0">
                    {/* Communication Panel Skeleton */}
                    <div className="rounded-3xl border border-border/40 h-[500px] bg-card shadow-sm flex flex-col">
                        <div className="p-5 border-b border-border/40">
                            <Skeleton className="h-5 w-40" />
                        </div>
                        <div className="flex-1 p-5 space-y-4">
                            <Skeleton className="h-16 w-3/4 rounded-2xl ml-auto" />
                            <Skeleton className="h-20 w-3/4 rounded-2xl" />
                            <Skeleton className="h-12 w-1/2 rounded-2xl ml-auto" />
                        </div>
                        <div className="p-4 border-t border-border/40">
                            <Skeleton className="h-12 w-full rounded-3xl" />
                        </div>
                    </div>
                </div>

                {/* Sidebar Timeline Skeleton */}
                <div className="lg:col-span-4 space-y-6 min-w-0">
                    <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-border/40">
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="p-6 md:p-8 space-y-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex gap-5">
                                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}