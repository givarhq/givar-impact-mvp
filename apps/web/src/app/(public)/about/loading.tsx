import { PublicLayout } from '../../../components/layout/public-layout';
import { Skeleton } from '../../../components/ui/skeleton';

export default function AboutLoading() {
    return (
        <PublicLayout>
            <div className="px-4 sm:px-6 pt-2 pb-14 max-w-4xl mx-auto space-y-8 sm:space-y-10 animate-in fade-in duration-500 w-full min-w-0">
                {/* Header Section Skeleton */}
                <section className="text-center space-y-2.5">
                    <Skeleton className="h-8 sm:h-10 w-48 mx-auto rounded-3xl" />
                    <Skeleton className="h-1 w-12 mx-auto rounded-full" />
                </section>

                {/* Core Narrative Section Skeleton */}
                <section className="space-y-3 sm:space-y-4 max-w-3xl mx-auto text-center sm:text-left">
                    <Skeleton className="h-5 w-3/4 rounded-xl" />
                    <Skeleton className="h-5 w-full rounded-xl" />
                    <Skeleton className="h-5 w-5/6 rounded-xl" />
                </section>

                {/* The Gap Section Skeleton */}
                <div className="rounded-3xl border border-border/40 bg-card p-5 sm:p-8 space-y-3">
                    <Skeleton className="h-6 w-24 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full rounded-xl" />
                        <Skeleton className="h-4 w-11/12 rounded-xl" />
                        <Skeleton className="h-4 w-4/5 rounded-xl" />
                    </div>
                </div>

                {/* Our Approach Section Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    <div className="p-5 sm:p-7 rounded-3xl border border-border/40 bg-card space-y-3">
                        <Skeleton className="h-6 w-32 rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-3.5 w-full rounded-xl" />
                            <Skeleton className="h-3.5 w-5/6 rounded-xl" />
                            <Skeleton className="h-3.5 w-4/5 rounded-xl" />
                        </div>
                    </div>
                    <div className="p-5 sm:p-7 rounded-3xl border border-primary/20 bg-primary/[0.03] space-y-3.5 flex flex-col justify-center">
                        <Skeleton className="h-4 w-40 rounded-xl" />
                        <Skeleton className="h-4 w-44 rounded-xl" />
                        <Skeleton className="h-4 w-36 rounded-xl" />
                    </div>
                </div>

                {/* Founder Section Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 sm:gap-8 items-center bg-card border border-border/40 rounded-3xl p-5 sm:p-8 shadow-sm">
                    <div className="sm:col-span-4 flex flex-col items-center space-y-2.5">
                        <Skeleton className="aspect-square w-32 sm:w-40 rounded-2xl" />
                        <Skeleton className="h-4 w-24 rounded-xl" />
                    </div>
                    <div className="sm:col-span-8 space-y-3">
                        <Skeleton className="h-6 w-48 rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-3.5 w-full rounded-xl" />
                            <Skeleton className="h-3.5 w-5/6 rounded-xl" />
                            <Skeleton className="h-3.5 w-4/5 rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* CTA Section Skeleton */}
                <div className="rounded-3xl p-6 sm:p-10 bg-zinc-950 text-center space-y-3 flex flex-col items-center">
                    <Skeleton className="h-7 w-64 rounded-2xl" />
                    <Skeleton className="h-4 w-80 max-w-full rounded-xl" />
                    <Skeleton className="h-11 sm:h-12 w-36 rounded-full mt-2" />
                </div>
            </div>
        </PublicLayout>
    );
}