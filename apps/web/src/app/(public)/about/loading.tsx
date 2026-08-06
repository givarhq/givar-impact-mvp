import { PublicLayout } from '../../../components/layout/public-layout';
import { Skeleton } from '../../../components/ui/skeleton';

export default function AboutLoading() {
    return (
        <PublicLayout variant="app">
            <div className="py-12 md:py-24 space-y-24 animate-in fade-in duration-500 w-full min-w-0">
                {/* Hero Section Skeleton */}
                <section className="text-center space-y-6">
                    <Skeleton className="h-6 w-48 rounded-full mx-auto" />
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-3/4 md:w-1/2 mx-auto rounded-3xl" />
                        <Skeleton className="h-12 w-2/3 md:w-1/3 mx-auto rounded-3xl" />
                    </div>
                    <Skeleton className="h-6 w-full max-w-2xl mx-auto rounded-3xl" />
                </section>

                {/* Manifesto Section Skeleton */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-64 rounded-3xl" />
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>
                    <Skeleton className="h-64 w-full rounded-3xl" />
                </section>

                {/* Values Grid Skeleton */}
                <section className="space-y-12">
                    <Skeleton className="h-8 w-40 mx-auto rounded-3xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-64 w-full rounded-3xl" />
                        ))}
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}