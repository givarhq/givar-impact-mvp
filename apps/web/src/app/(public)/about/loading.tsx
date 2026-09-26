import { PublicLayout } from '../../../components/layout/public-layout';
import { Skeleton } from '../../../components/ui/skeleton';

export default function AboutLoading() {
    return (
        <PublicLayout>
            <div className="pt-2 md:pt-4 pb-12 space-y-12 animate-in fade-in duration-500 w-full min-w-0 max-w-5xl mx-auto px-6">
                {/* Hero Section Skeleton */}
                <section className="text-center space-y-3">
                    <Skeleton className="h-8 md:h-10 w-2/3 md:w-1/3 mx-auto rounded-3xl" />
                    <Skeleton className="h-1 w-16 mx-auto rounded-full" />
                </section>

                {/* Narrative Skeleton */}
                <section className="space-y-4 max-w-3xl mx-auto">
                    <Skeleton className="h-4 w-full rounded-xl" />
                    <Skeleton className="h-4 w-5/6 rounded-xl" />
                    <Skeleton className="h-4 w-4/5 rounded-xl" />
                </section>

                {/* The Gap Box Skeleton */}
                <section className="h-48 w-full rounded-3xl border border-border/40 bg-card p-6" />

                {/* Values Grid Skeleton */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="h-40 w-full rounded-3xl" />
                    <Skeleton className="h-40 w-full rounded-3xl" />
                </section>
            </div>
        </PublicLayout>
    );
}