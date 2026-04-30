import { Skeleton } from '../../../../components/ui/skeleton';

export default function LedgerLoading() {
    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500">
            {/* Tabs Switcher Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="h-11 bg-muted/50 p-1 rounded-3xl w-full md:w-fit border border-border/50 inline-flex gap-2">
                    <Skeleton className="h-full w-32 rounded-3xl" />
                    <Skeleton className="h-full w-32 rounded-3xl" />
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="grid gap-4">
                <Skeleton className="h-[300px] w-full rounded-3xl" />
            </div>
        </div>
    );
}