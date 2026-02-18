import { Skeleton } from '../../../../../../components/ui/skeleton';

export default function EditProjectLoading() {
    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Navigation Header Skeleton */}
            <div className="flex flex-col gap-4 px-1 min-w-0">
                <Skeleton className="h-8 w-40 rounded-3xl" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-8 w-3/4 md:hidden" />
                        <Skeleton className="h-6 w-[200px] rounded-3xl" />
                    </div>
                </div>
            </div>

            {/* Tabs Terminal Skeleton */}
            <div className="w-full space-y-8 min-w-0">
                <div className="border-b border-border/40 pb-1 overflow-x-auto no-scrollbar">
                    <div className="h-12 w-full flex justify-start gap-8">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-8 w-32 rounded-none border-b-2 border-transparent" />
                        ))}
                    </div>
                </div>

                {/* Form Body Skeleton */}
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 md:p-8 rounded-3xl border border-border/40 bg-card">
                        <div className="md:col-span-12 flex items-center gap-3 mb-2">
                            <Skeleton className="h-10 w-10 rounded-3xl" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <div className="md:col-span-8 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-11 w-full rounded-3xl" />
                        </div>
                        <div className="md:col-span-4 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-11 w-full rounded-3xl" />
                        </div>
                        <div className="md:col-span-12 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-[200px] w-full rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Action Bar Skeleton */}
            <div className="fixed md:bottom-0 bottom-14 left-0 md:left-[260px] right-0 p-4 bg-background/90 border-t border-border/40 z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Skeleton className="h-10 w-32 rounded-3xl" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24 rounded-3xl" />
                        <Skeleton className="h-10 w-40 rounded-3xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}