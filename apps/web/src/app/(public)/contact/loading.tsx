import { Skeleton } from '../../../components/ui/skeleton';

export default function ContactLoading() {
    return (
        <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl space-y-12 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="text-center space-y-4">
                <Skeleton className="h-12 w-48 md:w-64 mx-auto rounded-3xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full max-w-md mx-auto rounded-3xl" />
                    <Skeleton className="h-4 w-3/4 max-w-[320px] mx-auto rounded-3xl" />
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className="rounded-3xl border border-border/40 bg-card p-8 space-y-6">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <div className="space-y-3">
                            <Skeleton className="h-6 w-32 rounded-3xl" />
                            <Skeleton className="h-4 w-full rounded-3xl" />
                        </div>
                        <Skeleton className="h-8 w-40 rounded-3xl" />
                    </div>
                ))}
            </div>

            {/* Bottom Note Skeleton */}
            <div className="p-8 rounded-3xl bg-muted/20 border border-dashed border-border/60">
                <Skeleton className="h-4 w-48 mx-auto rounded-3xl" />
            </div>
        </div>
    );
}