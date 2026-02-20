import { Skeleton } from '../../../../components/ui/skeleton';

export default function AdminSettingsLoading() {
    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Page Heading (Mobile Only) */}
            <div className="md:hidden px-1">
                <Skeleton className="h-7 w-48 rounded-3xl" />
            </div>

            {/* Navigation - Desktop (Horizontal Tabs) */}
            <div className="hidden md:block overflow-x-auto no-scrollbar pb-1">
                <div className="h-11 bg-muted/50 p-1 rounded-3xl w-fit border border-border/40 inline-flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-full w-36 rounded-3xl" />
                    ))}
                </div>
            </div>

            {/* Mobile Initial State: Admin Settings Menu List (4 Options) */}
            <div className="grid gap-2 md:hidden">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between p-4 bg-card border border-border/40 rounded-3xl h-[76px]"
                    >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Skeleton className="h-10 w-10 rounded-2xl shrink-0" />
                            <div className="space-y-2 flex-1 min-w-0">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-3 w-3/4" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-4 rounded-full ml-2 shrink-0" />
                    </div>
                ))}
            </div>

            {/* Desktop Initial State: Admin Identity View */}
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl">
                <div className="lg:col-span-4 space-y-4">
                    <div className="rounded-3xl border border-border/40 bg-card overflow-hidden shadow-sm p-6 text-center space-y-4">
                        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32 mx-auto" />
                            <Skeleton className="h-3 w-48 mx-auto" />
                        </div>
                        <div className="flex justify-center gap-2">
                            <Skeleton className="h-6 w-16 rounded-3xl" />
                            <Skeleton className="h-6 w-20 rounded-3xl" />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-4">
                    <div className="rounded-3xl border border-border/40 bg-card overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-border/40">
                            <Skeleton className="h-5 w-40" />
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-10 w-full rounded-3xl" />
                                <Skeleton className="h-10 w-full rounded-3xl" />
                            </div>
                            <Skeleton className="h-10 w-full rounded-3xl" />
                            <Skeleton className="h-10 w-full rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}