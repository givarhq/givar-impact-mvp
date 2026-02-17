'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Repeat, PauseCircle, PlayCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../../lib/utils/cn';
import { formatDate } from '../../../lib/utils/format';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { SmartCurrency } from '../../ui/smart-currency';
import { Subscription } from '../../../types';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';

export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const isActive = subscription.status === 'ACTIVE';

    const handleToggleStatus = async () => {
        setIsLoading(true);
        const newStatus = isActive ? 'PAUSED' : 'ACTIVE';

        try {
            await ApiService.donations.updateSubscription(subscription.id, newStatus);
            toast.success(`Subscription ${isActive ? 'paused' : 'resumed'} successfully`);
            router.refresh();
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className={cn(
            "relative overflow-hidden bg-card border-border/40 transition-all duration-300 rounded-3xl group shadow-sm",
            !isActive && "opacity-80"
        )}>
            <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 min-w-0">

                {/* Project Identity */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Link href={`/dashboard/impact/${subscription.project.slug}`} className="shrink-0">
                        <div className="h-14 w-14 rounded-2xl bg-muted overflow-hidden relative border border-border/40 shadow-inner group-hover:scale-105 transition-transform">
                            {subscription.project.imageUrl ? (
                                <img
                                    src={subscription.project.imageUrl}
                                    alt={subscription.project.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-primary/5 flex items-center justify-center text-primary/30">
                                    <Repeat className="h-6 w-6" />
                                </div>
                            )}
                        </div>
                    </Link>

                    <div className="flex-1 min-w-0 space-y-1">
                        <Link href={`/dashboard/impact/${subscription.project.slug}`} className="block min-w-0">
                            <h4 className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate">
                                {subscription.project.title}
                            </h4>
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground  tracking-tight">
                            <span className="flex items-center gap-1">
                                <Repeat className="h-3 w-3" /> {subscription.interval.toLowerCase()}
                            </span>
                            <span className="text-border">|</span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Next: {formatDate(subscription.nextChargeDate).split(',')[0]}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status & Value */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-none border-border/40 min-w-0">
                    <div className="text-left md:text-right min-w-0 shrink-0">
                        <p className="text-[11px] font-bold text-muted-foreground  tracking-widest leading-none mb-1.5">Contribution</p>
                        <div className="font-bold text-base text-foreground tabular-nums leading-none">
                            <SmartCurrency
                                amount={subscription.amount}
                                currency={subscription.currency}
                                visible={true}
                                size="default"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={cn(
                            "h-8 px-3 rounded-3xl font-bold text-[11px]  tracking-wider border shadow-none",
                            isActive
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-muted text-muted-foreground border-border/60"
                        )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full mr-2", isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40")} />
                            {subscription.status}
                        </Badge>

                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-9 w-9 transition-all rounded-2xl active:scale-95",
                                isActive
                                    ? "text-amber-600 hover:bg-amber-500/10"
                                    : "text-primary hover:bg-primary/10"
                            )}
                            onClick={handleToggleStatus}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isActive ? (
                                <PauseCircle className="h-5 w-5" />
                            ) : (
                                <PlayCircle className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}