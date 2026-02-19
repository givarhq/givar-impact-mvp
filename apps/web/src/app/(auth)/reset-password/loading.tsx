import { Skeleton } from '../../../components/ui/skeleton';

export default function ResetPasswordLoading() {
    return (
        <div className="w-full min-w-0 space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2 text-center">
                <Skeleton className="h-8 w-48 mx-auto rounded-3xl" />
                <Skeleton className="h-4 w-64 mx-auto rounded-3xl" />
            </div>

            <div className="space-y-5">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-24 ml-1" />
                    <Skeleton className="h-12 w-full rounded-3xl" />
                </div>

                <div className="space-y-2">
                    <Skeleton className="h-3 w-32 ml-1" />
                    <Skeleton className="h-12 w-full rounded-3xl" />
                </div>

                <Skeleton className="h-12 w-full rounded-3xl" />
            </div>
        </div>
    );
}