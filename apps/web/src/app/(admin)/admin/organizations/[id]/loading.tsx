import { Skeleton } from '../../../../../components/ui/skeleton';

export default function OrganizationDetailLoading() {
    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20 w-full overflow-hidden">
            {/* Hero & Action Bar Skeleton */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-card p-6 rounded-3xl border border-border/40 shadow-sm">
                <div className="flex items-center gap-5 w-full lg:w-auto">
                    <Skeleton className="h-16 w-16 rounded-3xl shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-5 w-20 rounded-3xl" />
                        </div>
                        <div className="flex gap-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <Skeleton className="h-11 flex-1 lg:w-32 rounded-3xl" />
                    <Skeleton className="h-11 flex-1 lg:w-28 rounded-3xl" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                {/* Left Column: Data & Identity Skeleton */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-3xl border border-border/40 bg-card overflow-hidden shadow-sm">
                        <div className="p-4 md:px-6 bg-muted/10 border-b border-border/40">
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="p-5 space-y-5">
                            <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/20 border border-border/40">
                                <Skeleton className="h-10 w-10 rounded-3xl shrink-0" />
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-40" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Skeleton className="h-14 w-full rounded-3xl" />
                                <Skeleton className="h-14 w-full rounded-3xl" />
                            </div>
                        </div>
                    </div>
                    <Skeleton className="h-64 w-full rounded-3xl" />
                </div>

                {/* Right Column: Impact History Skeleton */}
                <div className="lg:col-span-8 space-y-6 min-w-0">
                    <div className="flex items-center justify-between px-1">
                        <Skeleton className="h-6 w-40" />
                    </div>
                    <div className="grid gap-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="rounded-3xl border border-border/40 bg-card p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-20 rounded-3xl" />
                                        <Skeleton className="h-5 w-3/4" />
                                    </div>
                                    <Skeleton className="h-10 w-24 rounded-2xl" />
                                </div>
                                <Skeleton className="h-1.5 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}