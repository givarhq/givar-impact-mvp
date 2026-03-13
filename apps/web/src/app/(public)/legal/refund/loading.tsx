import { PublicLayout } from '../../../../components/layout/public-layout';
import { Skeleton } from '../../../../components/ui/skeleton';

export default function RefundLoading() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl space-y-8 animate-in fade-in duration-500">
                <div className="text-center space-y-3 pt-2">
                    <Skeleton className="h-12 w-48 md:w-64 mx-auto rounded-3xl" />
                    <Skeleton className="h-2 w-16 mx-auto rounded-full" />
                </div>
                <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden p-8 md:p-12 space-y-6">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <div className="pt-6 space-y-4">
                        <Skeleton className="h-8 w-48 rounded-3xl" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="pt-6 space-y-4">
                        <Skeleton className="h-8 w-64 rounded-3xl" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}