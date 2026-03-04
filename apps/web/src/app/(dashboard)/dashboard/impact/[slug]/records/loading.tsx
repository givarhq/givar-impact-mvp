import { Skeleton } from '../../../../../../components/ui/skeleton';

export default function LedgerLoading() {
    return (
        <div className="w-full min-w-0 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4 px-1">
                <Skeleton className="h-8 w-32 rounded-3xl" />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64 rounded-3xl" />
                    <Skeleton className="h-4 w-full max-w-md rounded-3xl" />
                </div>
            </div>

            <div className="space-y-4">
                <Skeleton className="h-11 w-48 rounded-3xl" />
                <div className="rounded-3xl border border-border/40 bg-card overflow-hidden">
                    <div className="h-12 bg-muted/40 border-b border-border/40" />
                    <div className="p-0">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="p-6 border-b border-border/40 last:border-0 flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1">
                                    <Skeleton className="h-10 w-10 rounded-3xl" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-1/4" />
                                        <Skeleton className="h-3 w-1/3" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-24 rounded-3xl" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}