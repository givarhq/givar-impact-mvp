import { PublicLayout } from '../../../components/layout/public-layout';
import { Skeleton } from '../../../components/ui/skeleton';

export default function HowItWorksLoading() {
    return (
        <PublicLayout variant="app">
            <div className="pb-16 space-y-16 animate-in fade-in duration-500 w-full min-w-0 max-w-5xl mx-auto">
                {/* Hero Skeleton */}
                <div className="text-center space-y-4">
                    <Skeleton className="h-6 w-32 mx-auto rounded-3xl" />
                    <Skeleton className="h-12 w-3/4 max-w-lg mx-auto rounded-3xl" />
                    <Skeleton className="h-4 w-full max-w-xl mx-auto rounded-xl" />
                    <Skeleton className="h-4 w-5/6 max-w-md mx-auto rounded-xl" />
                </div>

                {/* Steps Skeleton Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col items-center space-y-6">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <Skeleton className="w-full aspect-[762/519] rounded-[24px]" />
                            <Skeleton className="h-6 w-32 rounded-xl" />
                            <Skeleton className="h-4 w-full rounded-xl" />
                            <Skeleton className="h-4 w-5/6 rounded-xl" />
                        </div>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}