import { Skeleton } from '../../../../../../components/ui/skeleton';

export default function ProjectConsoleLoading() {
    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24">
            {/* Header Identity Skeleton */}
            <div className="flex flex-col gap-4 px-1 min-w-0">
                <Skeleton className="h-8 w-44 rounded-3xl" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-3/4" />
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-32 rounded-3xl" />
                        <Skeleton className="h-5 w-28 rounded-3xl" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
                {/* Action & Roadmap Skeleton */}
                <div className="lg:col-span-8 space-y-6 md:space-y-8">
                    <div className="rounded-[32px] border border-border/40 bg-card overflow-hidden shadow-sm">
                        <div className="p-6 md:p-8 border-b border-border/40 bg-muted/10 flex justify-between items-center">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-6 w-32 rounded-3xl" />
                        </div>
                        <div className="p-6 md:p-8 space-y-6">
                            <Skeleton className="h-24 w-full rounded-3xl" />
                            <div className="grid grid-cols-4 gap-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="aspect-square rounded-3xl" />
                                ))}
                            </div>
                            <Skeleton className="h-12 w-full rounded-3xl" />
                        </div>
                    </div>
                    <Skeleton className="h-[400px] w-full rounded-[32px]" />
                </div>

                {/* Financials Skeleton */}
                <div className="lg:col-span-4 space-y-6">
                    <Skeleton className="h-32 w-full rounded-[32px]" />
                    <div className="rounded-[32px] border border-border/40 bg-card overflow-hidden shadow-sm">
                        <div className="p-4 bg-muted/30 border-b border-border/40">
                            <Skeleton className="h-4 w-36" />
                        </div>
                        <div className="p-4 space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}