import { PublicLayout } from '../../../../components/layout/public-layout';
import { Skeleton } from '../../../../components/ui/skeleton';

export default function PartnerFormLoading() {
    return (
        <PublicLayout>
            <div className="w-full min-w-0 overflow-hidden bg-[#fafafa] dark:bg-background relative animate-in fade-in duration-500">
                <div className="container mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-20 relative z-10">
                    <div className="max-w-4xl mx-auto w-full min-w-0">

                        {/* Header Skeleton - Shifted up */}
                        <div className="text-center space-y-2 mb-6 md:mb-8">
                            <Skeleton className="h-3.5 w-28 mx-auto rounded-3xl" />
                            <div className="space-y-1.5">
                                <Skeleton className="h-9 sm:h-11 w-4/5 max-w-[480px] mx-auto rounded-3xl" />
                            </div>
                            <Skeleton className="h-4 w-3/5 max-w-[400px] mx-auto rounded-3xl" />
                        </div>

                        {/* Form Card Skeleton */}
                        <div className="rounded-[32px] border border-border/40 bg-card shadow-xl overflow-hidden p-6 md:p-10 space-y-6">
                            <div className="space-y-1.5">
                                <Skeleton className="h-3.5 w-24 rounded-3xl ml-1" />
                                <Skeleton className="h-12 w-full rounded-2xl" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                <div className="space-y-1.5">
                                    <Skeleton className="h-3.5 w-20 rounded-3xl ml-1" />
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                </div>
                                <div className="space-y-1.5">
                                    <Skeleton className="h-3.5 w-28 rounded-3xl ml-1" />
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                <div className="space-y-1.5">
                                    <Skeleton className="h-3.5 w-24 rounded-3xl ml-1" />
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                </div>
                                <div className="space-y-1.5">
                                    <Skeleton className="h-3.5 w-32 rounded-3xl ml-1" />
                                    <Skeleton className="h-12 w-full rounded-2xl" />
                                </div>
                            </div>

                            {/* Checkbox Grid Skeleton */}
                            <div className="space-y-3 pt-2">
                                <Skeleton className="h-3.5 w-60 rounded-3xl ml-1" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <Skeleton key={i} className="h-[54px] w-full rounded-2xl" />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <Skeleton className="h-3.5 w-44 rounded-3xl ml-1" />
                                <Skeleton className="h-[100px] w-full rounded-2xl" />
                            </div>

                            <div className="pt-4 space-y-4">
                                <Skeleton className="h-14 w-full rounded-3xl" />
                                <Skeleton className="h-3 w-1/2 mx-auto rounded-3xl" />
                            </div>
                        </div>

                        {/* Bottom 3 Features Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 md:pt-16 pb-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                                    <Skeleton className="h-11 w-11 rounded-2xl" />
                                    <Skeleton className="h-4 w-28 rounded-3xl" />
                                    <Skeleton className="h-3 w-40 rounded-3xl" />
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}