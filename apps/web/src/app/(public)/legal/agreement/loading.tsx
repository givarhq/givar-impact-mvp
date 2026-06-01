import { DocsLayout } from '../../../../components/layout/docs-layout';
import { Skeleton } from '../../../../components/ui/skeleton';

export default function LegalDocumentLoading() {
    return (
        <DocsLayout>
            <div className="space-y-8 animate-in fade-in duration-500 w-full">
                {/* Document Header Skeleton */}
                <div className="space-y-4 border-b border-border/40 pb-6">
                    <Skeleton className="h-10 w-3/4 max-w-sm rounded-3xl" />
                    <Skeleton className="h-4 w-32 rounded-3xl" />
                </div>

                {/* Main Content Body Skeleton */}
                <div className="space-y-10 pt-2">
                    {/* Intro paragraph skeletons */}
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full rounded-3xl" />
                        <Skeleton className="h-4 w-[90%] rounded-3xl" />
                        <Skeleton className="h-4 w-[95%] rounded-3xl" />
                    </div>

                    {/* Section Block Skeletons */}
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-4 pt-4 border-t border-border/40">
                            <Skeleton className="h-7 w-48 rounded-3xl" />
                            <div className="space-y-3 pt-2">
                                <Skeleton className="h-4 w-full rounded-3xl" />
                                <Skeleton className="h-4 w-[85%] rounded-3xl" />
                                <Skeleton className="h-4 w-[90%] rounded-3xl" />
                                <Skeleton className="h-4 w-[60%] rounded-3xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DocsLayout>
    );
}