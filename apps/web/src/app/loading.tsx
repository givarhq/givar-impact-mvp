import { Skeleton } from '../components/ui/skeleton';

export default function RootLandingLoading() {
    return (
        <div className="min-h-screen bg-black overflow-hidden">
            {/* Hero Section Placeholder */}
            <div className="relative h-screen w-full flex flex-col justify-end p-6 md:p-32">
                <div className="max-w-3xl space-y-8 relative z-10">
                    <div className="space-y-4">
                        <Skeleton className="h-16 md:h-24 w-3/4 bg-white/10" />
                        <Skeleton className="h-16 md:h-24 w-1/2 bg-white/10" />
                    </div>
                    <Skeleton className="h-6 w-full max-w-xl bg-white/5" />
                    <div className="flex gap-4 pt-4">
                        <Skeleton className="h-14 w-40 rounded-full bg-white/20" />
                        <Skeleton className="h-14 w-40 rounded-full bg-white/10" />
                    </div>
                </div>

                {/* Dashboard Snippet Placeholder */}
                <div className="mt-16 md:mt-24 w-full max-w-5xl">
                    <Skeleton className="aspect-video w-full rounded-[32px] bg-white/5 border border-white/10" />
                </div>

                {/* Floating Stat Card Placeholder */}
                <div className="absolute right-6 bottom-10 hidden lg:block">
                    <Skeleton className="h-48 w-80 rounded-2xl bg-black/40 border border-white/10" />
                </div>
            </div>
        </div>
    );
}