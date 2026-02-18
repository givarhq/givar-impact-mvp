import { Skeleton } from '../../../../../components/ui/skeleton';

export default function PublicDonationLoading() {
    return (
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8 pb-24 animate-in fade-in duration-500">
            {/* Navigation Header Skeleton */}
            <div className="flex flex-col gap-4 px-1">
                <Skeleton className="h-10 w-32 rounded-3xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Project Context Sidebar Skeleton */}
                <div className="lg:col-span-4 space-y-6">
                    <Skeleton className="aspect-video w-full rounded-[32px]" />
                    <div className="space-y-4 px-1">
                        <div className="space-y-2">
                            <Skeleton className="h-7 w-full" />
                            <Skeleton className="h-4 w-32 rounded-3xl" />
                        </div>
                        <div className="space-y-2">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-3 w-full" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Transaction Terminal Skeleton */}
                <div className="lg:col-span-8">
                    <div className="bg-card border border-border/40 rounded-3xl p-5 md:p-6 shadow-sm space-y-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-12 w-full rounded-3xl" />
                            </div>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-9 w-16 rounded-3xl" />
                                ))}
                            </div>
                            <div className="space-y-2 pt-4">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-12 w-full rounded-3xl" />
                            </div>
                        </div>
                        <div className="pt-6 border-t border-border/40">
                            <Skeleton className="h-12 w-full rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}