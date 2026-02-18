import { Skeleton } from '../../../components/ui/skeleton';

export default function SignupLoading() {
    return (
        <div className="w-full min-w-0 space-y-8 animate-in fade-in duration-500">
            {/* Title & Subtitle Skeleton */}
            <div className="space-y-2 text-center">
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto" />
            </div>

            {/* Form Fields Skeleton */}
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-16 ml-1" />
                        <Skeleton className="h-11 w-full rounded-3xl" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-16 ml-1" />
                        <Skeleton className="h-11 w-full rounded-3xl" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Skeleton className="h-3 w-24 ml-1" />
                    <Skeleton className="h-12 w-full rounded-3xl" />
                </div>

                <div className="space-y-2">
                    <Skeleton className="h-3 w-20 ml-1" />
                    <Skeleton className="h-12 w-full rounded-3xl" />
                </div>

                <div className="space-y-4 pt-2">
                    <Skeleton className="h-12 w-full rounded-3xl" />
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border/60" />
                        </div>
                        <div className="relative flex justify-center">
                            <Skeleton className="h-4 w-10 bg-background" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-48 mx-auto" />
                </div>
            </div>
        </div>
    );
}