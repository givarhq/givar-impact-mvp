import { Skeleton } from '../../../../../../components/ui/skeleton';

export default function StartProposalLoading() {
    return (
        <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-500 pt-2">
            {/* Header Skeleton */}
            <div className="text-center space-y-4 py-2">
                <Skeleton className="h-14 w-14 rounded-[24px] mx-auto" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 mx-auto" />
                    <Skeleton className="h-4 w-64 mx-auto" />
                </div>
            </div>

            {/* Main Setup Card Skeleton */}
            <div className="rounded-3xl border border-border/40 bg-card overflow-hidden shadow-sm">
                <div className="p-6 md:p-8 border-b border-border/40 bg-muted/10 space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-3 w-56" />
                </div>
                <div className="p-6 md:p-8 space-y-6">
                    <div className="space-y-4">
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
    );
}