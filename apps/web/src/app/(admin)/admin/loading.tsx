import { Skeleton } from '../../../components/ui/skeleton';

export default function AdminLoading() {
    return (
        <div className="space-y-4 md:space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header Stat Grid Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>

            {/* Main Financial & Operational Row Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <Skeleton className="h-[380px] w-full" />
                </div>
                <div className="lg:col-span-4">
                    <Skeleton className="h-[380px] w-full" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6">
                    <Skeleton className="h-[420px] w-full" />
                </div>
                <div className="lg:col-span-6">
                    <Skeleton className="h-[420px] w-full" />
                </div>
            </div>

            {/* Bottom Distribution Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6">
                <Skeleton className="lg:col-span-4 h-[380px]" />
                <Skeleton className="lg:col-span-4 h-[380px]" />
                <Skeleton className="lg:col-span-4 h-[380px]" />
            </div>
        </div>
    );
}