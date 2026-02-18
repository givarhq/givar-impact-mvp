import { Skeleton } from '../../../../../components/ui/skeleton';

export default function NewProjectLoading() {
    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header and Navigation Skeleton */}
            <div className="flex flex-col gap-4 px-1 min-w-0">
                <Skeleton className="h-9 w-40 rounded-3xl" />
                <div className="md:hidden">
                    <Skeleton className="h-8 w-48" />
                </div>
            </div>

            {/* Form Container Skeleton */}
            <div className="w-full min-w-0 space-y-8">
                {/* Section 1: Project Identity */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 md:p-8 rounded-3xl border border-border/40 bg-card">
                    <div className="md:col-span-12 flex items-center gap-3 mb-2">
                        <Skeleton className="h-10 w-10 rounded-3xl" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <div className="md:col-span-8 space-y-2">
                        <Skeleton className="h-3 w-20 ml-1" />
                        <Skeleton className="h-11 w-full rounded-3xl" />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                        <Skeleton className="h-3 w-20 ml-1" />
                        <Skeleton className="h-11 w-full rounded-3xl" />
                    </div>
                    <div className="md:col-span-12 space-y-2">
                        <Skeleton className="h-3 w-24 ml-1" />
                        <Skeleton className="h-16 w-full rounded-3xl" />
                    </div>
                </div>

                {/* Section 2: Visual Assets Grid */}
                <div className="p-6 md:p-8 rounded-3xl border border-border/40 bg-card space-y-6">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-3xl" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-5 space-y-3">
                            <Skeleton className="aspect-video w-full rounded-3xl" />
                        </div>
                        <div className="lg:col-span-7">
                            <Skeleton className="h-32 w-full rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Action Bar Skeleton */}
            <div className="fixed md:bottom-0 bottom-14 left-0 md:left-[260px] right-0 p-4 bg-background/90 border-t border-border/40 z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Skeleton className="h-10 w-24 rounded-3xl hidden sm:block" />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Skeleton className="h-10 flex-1 sm:w-28 rounded-3xl" />
                        <Skeleton className="h-10 flex-1 sm:w-40 rounded-3xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}