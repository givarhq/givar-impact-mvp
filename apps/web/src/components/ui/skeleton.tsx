import { cn } from '../../lib/utils/cn';

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('animate-pulse rounded-3xl bg-muted/50', className)}
            {...props}
        />
    );
}

export { Skeleton };