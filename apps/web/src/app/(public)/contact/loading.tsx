import { PublicLayout } from '../../../components/layout/public-layout';
import { Skeleton } from '../../../components/ui/skeleton';

export default function ContactLoading() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl space-y-10 animate-in fade-in duration-500">
                {/* Header Skeleton */}
                <div className="text-center space-y-3 pt-2">
                    <Skeleton className="h-12 w-48 md:w-64 mx-auto rounded-3xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full max-w-md mx-auto rounded-3xl" />
                        <Skeleton className="h-4 w-3/4 max-w-[320px] mx-auto rounded-3xl" />
                    </div>
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[1, 2].map((i) => (
                        <div key={i} className="rounded-3xl border border-border/40 bg-card p-8 space-y-6">
                            <Skeleton className="h-10 w-10 rounded-2xl" />
                            <div className="space-y-3">
                                <Skeleton className="h-6 w-32 rounded-3xl" />
                                <Skeleton className="h-4 w-full rounded-3xl" />
                            </div>
                            <Skeleton className="h-8 w-40 rounded-3xl" />
                        </div>
                    ))}
                </div>

                {/* Bottom Note Skeleton */}
                <div className="p-6 rounded-3xl bg-muted/20 border border-dashed border-border/60">
                    <Skeleton className="h-4 w-48 mx-auto rounded-3xl" />
                </div>
            </div>
        </PublicLayout>
    );
}