import { Skeleton } from '../../../../components/ui/skeleton';

export default function AdminUsersLoading() {
    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header & Filter Block Skeleton */}
            <div className="flex items-center justify-between gap-4 h-10 w-full">
                <div className="flex items-center gap-6 flex-1">
                    <Skeleton className="md:hidden h-7 w-20 shrink-0" />
                    <Skeleton className="hidden md:block h-10 max-w-md flex-1" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 md:hidden" />
                    <div className="hidden md:flex gap-2">
                        <Skeleton className="h-10 w-[130px]" />
                        <Skeleton className="h-10 w-[130px]" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-6">
                <Skeleton className="h-12 w-full md:w-[280px] rounded-3xl" />

                {/* Table Container Skeleton */}
                <div className="rounded-3xl border border-border/40 shadow-sm overflow-hidden bg-card">
                    <div className="bg-muted/40 border-b border-border/40 p-5 hidden md:flex justify-between">
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="divide-y divide-border/40">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="p-4 md:px-5 md:py-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1">
                                    <Skeleton className="h-4 w-4 hidden md:block" />
                                    <Skeleton className="h-10 w-10 md:h-8 md:w-8 shrink-0" />
                                    <div className="space-y-1.5 flex-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-40" />
                                    </div>
                                </div>
                                <Skeleton className="hidden md:block h-6 w-20" />
                                <Skeleton className="hidden md:block h-4 w-24" />
                                <div className="text-right space-y-1.5">
                                    <Skeleton className="h-4 w-20 ml-auto" />
                                    <Skeleton className="h-4 w-16 ml-auto md:hidden" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}