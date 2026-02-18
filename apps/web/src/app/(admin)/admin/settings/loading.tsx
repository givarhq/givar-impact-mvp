import { Skeleton } from '../../../../components/ui/skeleton';

export default function AdminSettingsLoading() {
    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Page Heading (Mobile) Skeleton */}
            <Skeleton className="h-7 w-40 md:hidden ml-1" />

            {/* Tabs Navigation Skeleton */}
            <div className="hidden md:block">
                <div className="h-11 bg-muted/50 p-1 rounded-3xl w-fit border border-border/40 inline-flex gap-2 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-full w-36 rounded-3xl" />
                    ))}
                </div>
            </div>

            {/* Mobile Navigation List Skeleton */}
            <div className="grid gap-2 md:hidden">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-3xl" />
                ))}
            </div>

            {/* Content Area Skeleton (Profile Form default) */}
            <div className="max-w-5xl space-y-6 hidden md:block">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 space-y-4">
                        <Skeleton className="h-[280px] w-full rounded-3xl" />
                        <Skeleton className="h-32 w-full rounded-3xl" />
                    </div>
                    <div className="lg:col-span-8">
                        <Skeleton className="h-[400px] w-full rounded-3xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}