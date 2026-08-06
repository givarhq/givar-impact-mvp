import { PublicLayout } from '../../../../../components/layout/public-layout';
import { Skeleton } from '../../../../../components/ui/skeleton';

export default function ProjectRecordsLoading() {
    return (
        <PublicLayout variant="app">
            <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">
                {/* Header Skeleton */}
                <div className="flex flex-col gap-4 px-1 min-w-0">
                    <Skeleton className="h-9 w-32 rounded-3xl" />

                    <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-48 rounded-3xl" />
                            <Skeleton className="h-8 w-8 rounded-2xl hidden sm:block" />
                        </div>
                        <Skeleton className="h-4 w-full max-w-xl rounded-3xl" />
                    </div>
                </div>

                <div className="w-full min-w-0 space-y-6">
                    {/* Table Skeleton */}
                    <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden min-w-0">
                        <div className="hidden md:flex items-center justify-between p-4 bg-muted/40 border-b border-border/40">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-10" />
                        </div>

                        <div className="divide-y divide-border/40">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="p-4 md:px-6 md:py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-1 w-full">
                                        <Skeleton className="h-10 w-10 rounded-3xl shrink-0" />
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            <div className="flex justify-between md:justify-start gap-2">
                                                <Skeleton className="h-4 w-32 md:w-48 rounded-3xl" />
                                                <Skeleton className="h-4 w-16 md:hidden rounded-3xl" />
                                            </div>
                                            <Skeleton className="h-3 w-24 md:w-64 rounded-3xl" />
                                        </div>
                                    </div>

                                    <div className="hidden md:contents">
                                        <Skeleton className="h-4 w-32 rounded-3xl" />
                                        <Skeleton className="h-4 w-24 rounded-3xl" />
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <Skeleton className="h-8 w-20 rounded-3xl shrink-0" />
                                    </div>

                                    <div className="md:hidden mt-1 w-full flex justify-center">
                                        <Skeleton className="h-9 w-24 rounded-3xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}