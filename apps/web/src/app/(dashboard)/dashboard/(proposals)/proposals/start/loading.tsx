import { Skeleton } from '../../../../../../components/ui/skeleton';

export default function StartProposalLoading() {
    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pt-2 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

                {/* Left Column: Form Skeleton */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="rounded-3xl border border-border/40 bg-card overflow-hidden shadow-sm">
                        <div className="p-6 md:p-8 border-b border-border/40 bg-muted/10 space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                        <div className="p-6 md:p-8 space-y-6">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-24 ml-1" />
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-32 ml-1" />
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                </div>
                            </div>
                            <Skeleton className="h-14 w-full rounded-3xl" />
                        </div>
                    </div>
                </div>

                {/* Right Column: Checklist Skeleton */}
                <div className="lg:col-span-5 space-y-4 pt-2 lg:pt-0">
                    <div className="flex items-center gap-2 px-2">
                        <Skeleton className="h-5 w-5 rounded-md" />
                        <Skeleton className="h-5 w-40" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-card border border-border/40 p-5 rounded-3xl flex items-start gap-4">
                                <Skeleton className="h-10 w-10 rounded-2xl shrink-0" />
                                <div className="space-y-2 flex-1 pt-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}