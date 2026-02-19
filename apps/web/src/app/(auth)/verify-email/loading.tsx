import { Skeleton } from '../../../components/ui/skeleton';

export default function VerifyEmailLoading() {
    return (
        <div className="w-full min-w-0 space-y-8 text-center animate-in fade-in duration-500">
            <div className="py-8 space-y-6">
                <div className="relative h-16 w-16 mx-auto">
                    <Skeleton className="h-16 w-16 rounded-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 mx-auto rounded-3xl" />
                    <Skeleton className="h-4 w-64 mx-auto rounded-3xl" />
                </div>
            </div>
        </div>
    );
}