import { Skeleton } from '../../../../../../../components/ui/skeleton';

export default function ProposalEditStepLoading() {
    return (
        <div className="space-y-6 w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Container Card Skeleton - Used by Hook, Media, Plan, & Trust steps */}
            <div className="border border-border/40 bg-card rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 md:p-8 border-b border-border/40 bg-muted/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-3 w-20 rounded-3xl" />
                    </div>
                    <Skeleton className="h-7 w-64 mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                </div>

                <div className="p-6 md:p-8 pt-8 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-24 ml-1" />
                            <Skeleton className="h-12 w-full rounded-2xl" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-32 ml-1" />
                            <Skeleton className="h-24 w-full rounded-2xl" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-28 ml-1" />
                            <Skeleton className="h-[200px] w-full rounded-2xl" />
                        </div>
                    </div>

                    {/* Navigation Footer Skeleton */}
                    <div className="flex justify-between items-center pt-6 border-t border-border/40">
                        <Skeleton className="h-12 w-28 rounded-3xl" />
                        <Skeleton className="h-12 w-40 rounded-3xl" />
                    </div>
                </div>
            </div>

            {/* Discussion Thread Placeholder */}
            <div className="rounded-3xl border border-border/40 h-48 bg-muted/5 border-dashed flex items-center justify-center">
                <Skeleton className="h-4 w-48 rounded-3xl" />
            </div>
        </div>
    );
}