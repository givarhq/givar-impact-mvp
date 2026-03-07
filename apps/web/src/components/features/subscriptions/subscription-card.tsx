'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, Repeat, PauseCircle, PlayCircle, Loader2, CreditCard, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../../lib/utils/cn';
import { formatDate } from '../../../lib/utils/format';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { SmartCurrency } from '../../ui/smart-currency';
import { Subscription } from '../../../types';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export const SubscriptionCard = memo(function SubscriptionCard({ subscription }: { subscription: Subscription }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const isActive = subscription.status === 'ACTIVE';

    const handleToggleStatus = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setIsLoading(true);
        const newStatus = isActive ? 'PAUSED' : 'ACTIVE';

        try {
            await ApiService.donations.updateSubscription(subscription.id, newStatus);
            toast.success(`Subscription ${isActive ? 'paused' : 'resumed'}`);
            router.refresh();
        } catch (error) {
            toast.error("Status update failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
        >
            <Link
                href={`/dashboard/impact/${subscription.project.slug}`}
                className={cn(
                    "group block relative overflow-hidden rounded-2xl bg-card border border-border/40 transition-all duration-200",
                    !isActive && "opacity-75 grayscale-[0.5] hover:opacity-100 hover:grayscale-0",
                    isActive ? "hover:border-primary/30 hover:shadow-sm" : "hover:bg-muted/20"
                )}
            >
                <div className="flex h-24 sm:h-28">
                    {/* Left: Visual Identity */}
                    <div className="relative w-24 sm:w-28 shrink-0 bg-muted border-r border-border/40 overflow-hidden">
                        {subscription.project.imageUrl ? (
                            <Image
                                src={subscription.project.imageUrl}
                                alt={subscription.project.title}
                                fill
                                sizes="112px"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="h-full w-full bg-primary/5 flex items-center justify-center text-primary/30">
                                <Repeat className="h-8 w-8" />
                            </div>
                        )}

                        {/* Status Overlay on Image */}
                        <div className="absolute top-2 left-2">
                            <div className={cn(
                                "h-2 w-2 rounded-full ring-2 ring-white dark:ring-zinc-950 shadow-sm",
                                isActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                            )} />
                        </div>
                    </div>

                    {/* Right: Content & Controls */}
                    <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                        <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0 space-y-1">
                                <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                                    {subscription.project.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground tracking-tight">
                                    <Badge variant="secondary" className="h-5 px-1.5 rounded-md text-[10px] font-bold bg-muted border-border/50 text-foreground/70">
                                        {subscription.interval}
                                    </Badge>
                                    <span className="flex items-center gap-1 truncate">
                                        <Calendar className="h-3 w-3 opacity-70" /> {formatDate(subscription.nextChargeDate).split(',')[0]}
                                    </span>
                                </div>
                            </div>

                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleToggleStatus}
                                disabled={isLoading}
                                className={cn(
                                    "h-8 w-8 rounded-full shrink-0 transition-all active:scale-90 border",
                                    isActive
                                        ? "text-amber-600 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20"
                                        : "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
                                )}
                                title={isActive ? "Pause Subscription" : "Resume Subscription"}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : isActive ? (
                                    <PauseCircle className="h-4 w-4" />
                                ) : (
                                    <PlayCircle className="h-4 w-4 ml-0.5" />
                                )}
                            </Button>
                        </div>

                        <div className="flex items-end justify-between border-t border-border/40 pt-2.5 mt-1">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Amount</span>
                                <div className="font-black text-foreground text-sm flex items-center gap-1">
                                    <SmartCurrency
                                        amount={subscription.amount}
                                        currency={subscription.currency}
                                        visible={true}
                                        size="default"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
                                Manage <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
});