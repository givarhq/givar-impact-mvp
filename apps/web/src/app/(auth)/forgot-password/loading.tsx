import { Skeleton } from '../../../components/ui/skeleton';

export default function ForgotPasswordLoading() {
    return (
        <div className="w-full min-w-0 space-y-8 animate-in fade-in duration-500">
            <div className="space-y-3 text-center">
                <Skeleton className="h-8 w-64 mx-auto" />
                <Skeleton className="h-4 w-full max-w-[280px] mx-auto" />
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-24 ml-1" />
                    <Skeleton className="h-12 w-full rounded-3xl" />
                </div>

                <Skeleton className="h-12 w-full rounded-3xl" />

                <div className="text-center pt-2">
                    <Skeleton className="h-4 w-32 mx-auto" />
                </div>
            </div>
        </div>
    );
}