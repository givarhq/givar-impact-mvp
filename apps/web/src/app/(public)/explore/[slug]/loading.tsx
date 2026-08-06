import { Skeleton } from '../../../../components/ui/skeleton';

export default function PublicProjectDetailsLoading() {
    return (
        <div className="container mx-auto px-4 py-6 md:py-10 animate-in fade-in duration-500 min-w-0">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 lg:gap-10 items-start min-w-0">

                {/* Left Sidebar Skeleton (Desktop Only) */}
                <div className="hidden xl:block xl:col-span-1 w-full space-y-6">
                    <div className="flex items-center gap-3 px-1">
                        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                        <Skeleton className="h-5 w-32 rounded-xl" />
                    </div>
                    <div className="grid gap-5">
                        {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-72 w-full rounded-3xl" />
                        ))}
                    </div>
                </div>

                {/* Main Content Area Skeleton */}
                <div className="xl:col-span-3 w-full min-w-0 space-y-4 md:space-y-6">
                    {/* Navigation Header Skeleton */}
                    <div className="flex flex-col gap-4 px-1">
                        <Skeleton className="h-8 w-32 rounded-3xl" />
                        <Skeleton className="h-7 w-40 md:hidden" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-20">
                        <div className="lg:col-span-2 space-y-4 md:space-y-6">
                            {/* Header Metadata Skeleton */}
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-24 rounded-3xl" />
                                    <Skeleton className="h-6 w-16 rounded-3xl" />
                                </div>
                                <Skeleton className="h-8 w-3/4" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </div>

                            {/* Media Section Skeleton */}
                            <div className="space-y-3">
                                <Skeleton className="aspect-video w-full rounded-3xl" />
                                <div className="grid grid-cols-6 gap-2">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <Skeleton key={i} className="aspect-square rounded-3xl" />
                                    ))}
                                </div>
                            </div>

                            {/* Tabs Content Skeleton */}
                            <div className="space-y-4">
                                <Skeleton className="h-11 w-full md:w-[400px] rounded-3xl" />
                                <div className="space-y-4 pt-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar Skeleton */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="rounded-3xl border border-border/40 p-5 space-y-6 bg-card shadow-sm">
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-6 w-28 rounded-3xl" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-10 w-48" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-1.5 w-full rounded-full" />
                                </div>
                                <div className="grid grid-cols-1 gap-3 pt-2">
                                    <Skeleton className="h-12 w-full rounded-3xl" />
                                    <Skeleton className="h-11 w-full rounded-3xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}