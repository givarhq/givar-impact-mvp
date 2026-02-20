import { Skeleton } from '../../../../../components/ui/skeleton';

export default function FundWalletLoading() {
    return (
        <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Back Button Skeleton */}
            <Skeleton className="h-9 w-32 rounded-3xl" />

            {/* Main Funding Card Skeleton */}
            <div className="border border-border/40 shadow-xl overflow-hidden rounded-3xl bg-card">
                <div className="pt-8 px-6 md:px-8 border-b border-border/40 bg-muted/10 pb-6 space-y-3">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-56" />
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-10">
                    <div className="space-y-4">
                        <Skeleton className="h-3 w-28 ml-1" />
                        <Skeleton className="h-16 w-full rounded-[22px]" />
                        <div className="flex gap-2 pt-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-9 w-16 rounded-3xl" />
                            ))}
                        </div>
                    </div>

                    <Skeleton className="h-24 w-full rounded-[24px]" />
                    <Skeleton className="h-12 w-full rounded-3xl" />
                </div>
            </div>
        </div>
    );
}