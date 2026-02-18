import { Skeleton } from '../../../../../components/ui/skeleton';

export default function ProposalReviewLoading() {
    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Context Skeleton */}
            <div className="flex flex-col gap-4 px-1">
                <Skeleton className="h-8 w-32 rounded-3xl" />
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-6 rounded-3xl border border-border/40 bg-card">
                    <div className="flex items-center gap-5 flex-1 w-full">
                        <Skeleton className="h-16 w-16 rounded-3xl shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="flex gap-3">
                                <Skeleton className="h-7 w-1/2" />
                                <Skeleton className="h-6 w-20 rounded-3xl" />
                            </div>
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <div className="flex gap-3 w-full lg:w-auto">
                        <Skeleton className="h-11 flex-1 lg:w-40 rounded-3xl" />
                        <Skeleton className="h-11 flex-1 lg:w-48 rounded-3xl" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Skeleton */}
                <div className="lg:col-span-8 space-y-6">
                    <Skeleton className="h-[300px] w-full rounded-3xl" />
                    <Skeleton className="h-[400px] w-full rounded-3xl" />
                    <Skeleton className="h-[300px] w-full rounded-3xl" />
                </div>

                {/* Sidebar Skeleton */}
                <div className="lg:col-span-4 space-y-6">
                    <Skeleton className="h-[240px] w-full rounded-3xl" />
                    <Skeleton className="h-[400px] w-full rounded-3xl" />
                    <Skeleton className="h-[200px] w-full rounded-3xl" />
                </div>
            </div>
        </div>
    );
}