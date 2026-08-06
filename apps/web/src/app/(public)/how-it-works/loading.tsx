import { PublicLayout } from '../../../components/layout/public-layout';
import { Skeleton } from '../../../components/ui/skeleton';

export default function HowItWorksLoading() {
    return (
        <PublicLayout variant="app">
            <div className="py-16 md:py-24 space-y-24 animate-in fade-in duration-500 w-full min-w-0 max-w-5xl mx-auto">
                {/* Hero Skeleton */}
                <div className="text-center space-y-6">
                    <Skeleton className="h-12 w-3/4 max-w-lg mx-auto rounded-3xl" />
                    <Skeleton className="h-6 w-full max-w-2xl mx-auto rounded-xl" />
                    <Skeleton className="h-6 w-5/6 max-w-xl mx-auto rounded-xl" />
                </div>

                {/* Timeline Items Skeleton */}
                <div className="space-y-32">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`flex flex-col md:flex-row items-center gap-12 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                            <div className="w-full md:w-1/2">
                                <Skeleton className="w-full aspect-[4/3] rounded-[32px]" />
                            </div>
                            <div className="w-full md:w-1/2">
                                <Skeleton className="w-full h-48 rounded-[32px]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}