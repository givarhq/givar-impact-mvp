import { Skeleton } from '../../../ui/skeleton';
import { Card, CardContent, CardHeader } from '../../../ui/card';

export function ChartSkeleton({ height = "380px" }: { height?: string }) {
    return (
        <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden flex flex-col" style={{ height }}>
            <CardHeader className="p-5 md:p-6 pb-2 flex flex-row items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-4 w-12 rounded-full" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex items-end gap-2">
                {[...Array(12)].map((_, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1 rounded-t-lg"
                        style={{ height: `${Math.floor(Math.random() * 60) + 20}%` }}
                    />
                ))}
            </CardContent>
        </Card>
    );
}