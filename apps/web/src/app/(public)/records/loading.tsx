import { PublicLayout } from '../../../components/layout/public-layout';
import { Skeleton } from '../../../components/ui/skeleton';

export default function GlobalRecordsLoading() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 space-y-6 animate-in fade-in duration-500">
                {/* Header Skeleton */}
                <div className="flex flex-col gap-2 px-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-2xl" />
                        <Skeleton className="h-8 w-48 rounded-3xl" />
                    </div>
                    <Skeleton className="h-4 w-full max-w-lg mx-auto md:mx-0 rounded-3xl" />
                </div>

                <div className="w-full min-w-0 space-y-6">
                    {/* Tabs Skeleton */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
                        <div className="h-12 md:h-11 w-full md:w-[320px] bg-muted/50 rounded-3xl border border-border/40 p-1 flex gap-1">
                            <Skeleton className="flex-1 h-full rounded-3xl bg-background shadow-sm" />
                            <div className="flex-1" />
                            <div className="flex-1" />
                        </div>
                    </div>

                    {/* Table Skeleton */}
                    <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden min-w-0">
                        {/* Desktop Header */}
                        <div className="hidden md:flex items-center justify-between p-4 bg-muted/40 border-b border-border/40">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-10" />
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-border/40">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="p-4 md:px-6 md:py-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Skeleton className="h-10 w-10 rounded-3xl shrink-0" />
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            <div className="flex justify-between md:justify-start gap-2">
                                                <Skeleton className="h-4 w-32 md:w-48 rounded-3xl" />
                                                <Skeleton className="h-4 w-16 md:hidden rounded-3xl" />
                                            </div>
                                            <Skeleton className="h-3 w-24 md:w-64 rounded-3xl" />
                                        </div>
                                    </div>

                                    {/* Desktop Columns */}
                                    <Skeleton className="hidden md:block h-4 w-32 rounded-3xl" />
                                    <Skeleton className="hidden md:block h-4 w-24 rounded-3xl" />
                                    <Skeleton className="hidden md:block h-8 w-8 rounded-full" />

                                    <div className="hidden md:block text-right">
                                        <Skeleton className="h-8 w-20 rounded-3xl" />
                                    </div>

                                    {/* Mobile Action */}
                                    <div className="md:hidden mt-2 w-full">
                                        <Skeleton className="h-9 w-24 mx-auto rounded-3xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagination Skeleton */}
                    <div className="pt-4 border-t border-border/40 flex justify-between items-center">
                        <Skeleton className="h-4 w-32 rounded-3xl" />
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-24 rounded-3xl" />
                            <Skeleton className="h-9 w-24 rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}