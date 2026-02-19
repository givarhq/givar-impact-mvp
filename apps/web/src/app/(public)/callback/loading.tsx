import { Skeleton } from '../../../components/ui/skeleton';

export default function CallbackLoading() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="w-full max-w-[440px] border border-border/40 shadow-2xl rounded-3xl bg-card/50 backdrop-blur-2xl p-8 md:p-12 space-y-10 text-center">
                <div className="space-y-6 py-10 flex flex-col items-center">
                    <div className="relative h-16 w-16">
                        <Skeleton className="h-16 w-16 rounded-full" />
                    </div>
                    <div className="space-y-3 w-full">
                        <Skeleton className="h-8 w-3/4 mx-auto rounded-3xl" />
                        <Skeleton className="h-4 w-1/2 mx-auto rounded-3xl" />
                    </div>
                </div>
                <Skeleton className="h-12 w-full rounded-3xl" />
            </div>
        </div>
    );
}