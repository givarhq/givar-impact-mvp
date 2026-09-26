import { PublicLayout } from '../../../components/layout/public-layout';
import { Skeleton } from '../../../components/ui/skeleton';

export default function HowItWorksLoading() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 pb-12 max-w-[1400px] pt-4 md:pt-8 space-y-16 animate-in fade-in duration-500 w-full min-w-0">
                {/* Hero Skeleton - Only Visible on Mobile */}
                <div className="text-center space-y-3 md:hidden pb-6">
                    <Skeleton className="h-4 w-28 mx-auto rounded-3xl" />
                    <Skeleton className="h-10 w-4/5 max-w-md mx-auto rounded-3xl" />
                    <Skeleton className="h-4 w-full max-w-lg mx-auto rounded-xl" />
                </div>

                {/* Steps Skeleton Grid - Matches Exact Spacing of HowItWorksContent */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6 pt-2 md:pt-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col items-center space-y-6 pt-8">
                            <Skeleton className="w-full aspect-[762/519] rounded-[24px]" />
                            <Skeleton className="h-6 w-36 rounded-xl" />
                            <Skeleton className="h-4 w-full rounded-xl" />
                            <Skeleton className="h-4 w-4/5 rounded-xl" />
                        </div>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}