import { PublicLayout } from '../../../components/layout/public-layout';
import { Skeleton } from '../../../components/ui/skeleton';

export default function AboutLoading() {
    return (
        <PublicLayout>
            <div className="pt-2 md:pt-4 pb-16 space-y-16 animate-in fade-in duration-500 w-full min-w-0 max-w-5xl mx-auto px-6">
                {/* Hero Section Skeleton */}
                <section className="text-center space-y-4">
                    <Skeleton className="h-4 w-40 rounded-full mx-auto" />
                    <div className="space-y-2">
                        <Skeleton className="h-10 md:h-12 w-3/4 md:w-1/2 mx-auto rounded-3xl" />
                        <Skeleton className="h-10 md:h-12 w-2/3 md:w-1/3 mx-auto rounded-3xl" />
                    </div>
                    <Skeleton className="h-4 w-full max-w-2xl mx-auto rounded-3xl" />
                </section>

                {/* Manifesto Section Skeleton */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                    <div className="space-y-4">
                        <Skeleton className="h-7 w-56 rounded-3xl" />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full rounded-2xl" />
                            <Skeleton className="h-4 w-full rounded-2xl" />
                            <Skeleton className="h-4 w-5/6 rounded-2xl" />
                        </div>
                    </div>
                    <Skeleton className="h-60 w-full rounded-[32px]" />
                </section>

                {/* Values Grid Skeleton */}
                <section className="space-y-8">
                    <Skeleton className="h-7 w-36 mx-auto rounded-3xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-56 w-full rounded-[32px]" />
                        ))}
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}