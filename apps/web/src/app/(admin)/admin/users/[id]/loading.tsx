import { Skeleton } from '../../../../../components/ui/skeleton';

export default function UserForensicLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-44 rounded-3xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
                {/* Identity & Controls Skeleton */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-3xl border border-border/40 bg-card overflow-hidden shadow-sm p-6 text-center space-y-4">
                        <Skeleton className="h-20 w-20 rounded-3xl mx-auto" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-40 mx-auto" />
                            <Skeleton className="h-4 w-56 mx-auto" />
                        </div>
                        <div className="flex justify-center gap-2">
                            <Skeleton className="h-6 w-16 rounded-3xl" />
                            <Skeleton className="h-6 w-20 rounded-3xl" />
                        </div>
                        <div className="pt-4 space-y-2">
                            <Skeleton className="h-10 w-full rounded-3xl" />
                            <div className="grid grid-cols-2 gap-2">
                                <Skeleton className="h-10 w-full rounded-3xl" />
                                <Skeleton className="h-10 w-full rounded-3xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financials & Audit Skeleton */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-3xl" />
                        ))}
                    </div>

                    <div className="rounded-3xl border border-border/40 bg-card overflow-hidden shadow-sm">
                        <div className="p-4 md:px-6 bg-muted/10 border-b border-border/40">
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="divide-y divide-border/40">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 md:px-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-3xl" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-3 w-12" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-12" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-border/40 bg-card overflow-hidden shadow-sm">
                        <div className="p-4 md:px-6 bg-muted/10 border-b border-border/40">
                            <Skeleton className="h-4 w-40" />
                        </div>
                        <div className="p-0">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="p-4 md:px-6 border-b border-border/40 last:border-0 flex items-center justify-between">
                                    <Skeleton className="h-6 w-28 rounded-3xl" />
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}