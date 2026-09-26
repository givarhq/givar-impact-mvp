import { PublicLayout } from '../../../../components/layout/public-layout';
import { Skeleton } from '../../../../components/ui/skeleton';

export default function PartnerFormLoading() {
    return (
        <PublicLayout>
            <div className="w-full min-w-0 overflow-hidden bg-[#fafafa] dark:bg-background relative animate-in fade-in duration-500">
                <div className="container mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-24 relative z-10">
                    <div className="max-w-4xl mx-auto w-full min-w-0">

                        {/* Header Skeleton */}
                        <div className="text-center space-y-4 mb-10 md:mb-12">
                            <Skeleton className="h-4 w-32 mx-auto rounded-3xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-10 md:h-12 w-[80%] max-w-[500px] mx-auto rounded-3xl" />
                                <Skeleton className="h-10 md:h-12 w-[60%] max-w-[400px] mx-auto rounded-3xl" />
                            </div>
                            <Skeleton className="h-5 w-[70%] max-w-[600px] mx-auto rounded-3xl" />
                        </div>

                        {/* Form Skeleton */}
                        <div className="rounded-[32px] border border-border/40 bg-card shadow-xl overflow-hidden p-6 md:p-10 space-y-6">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24 rounded-3xl ml-1" />
                                <Skeleton className="h-12 w-full rounded-2xl" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20 rounded-3xl ml-1" />
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-28 rounded-3xl ml-1" />
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24 rounded-3xl ml-1" />
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32 rounded-3xl ml-1" />
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                </div>
                            </div>

                            {/* Checkboxes Skeleton */}
                            <div className="space-y-3 pt-2">
                                <Skeleton className="h-4 w-64 rounded-3xl ml-1" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <Skeleton key={i} className="h-[54px] w-full rounded-2xl" />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Skeleton className="h-4 w-48 rounded-3xl ml-1" />
                                <Skeleton className="h-[100px] w-full rounded-2xl" />
                            </div>

                            <div className="pt-4 space-y-4">
                                <Skeleton className="h-14 w-full rounded-3xl" />
                                <Skeleton className="h-3 w-[60%] mx-auto rounded-3xl" />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}