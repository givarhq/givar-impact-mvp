'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Repeat, PauseCircle, PlayCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../../lib/utils/cn';
import { formatDate } from '../../../lib/utils/format';
import { Card } from '../../ui/card';
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
        router.refresh(); // Refresh server data
    } catch (error) {
        toast.error("Failed to update subscription");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-border/50 to-transparent hover:from-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <Card className="relative p-5 rounded-[15px] bg-card/95 backdrop-blur-sm border-none overflow-hidden">
        
        {/* Active Glow Effect */}
        {isActive && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none" />
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            
            {/* Project Info */}
            <div className="flex items-center gap-4 flex-1">
                <Link href={`/dashboard/impact/${subscription.project.slug}`} className="shrink-0 group/img">
                    <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden relative shadow-sm border border-border/50 transition-transform group-hover/img:scale-105">
                        {subscription.project.imageUrl ? (
                            <img 
                                src={subscription.project.imageUrl} 
                                alt={subscription.project.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary/40">
                                <Repeat className="h-6 w-6" />
                            </div>
                        )}
                    </div>
                </Link>
                
                <div className="space-y-1">
                    <Link href={`/dashboard/impact/${subscription.project.slug}`} className="block">
                        <h4 className="font-bold text-foreground hover:text-primary transition-colors line-clamp-1">
                            {subscription.project.title}
                        </h4>
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-background/50 backdrop-blur-sm">
                            {subscription.interval}
                        </Badge>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Next: {formatDate(subscription.nextChargeDate).split(',')[0]}
                        </span>
                    </div>
                </div>
            </div>

            {/* Financials & Status */}
            <div className="flex items-center gap-6 md:gap-10 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Amount</p>
                    <div className="font-bold text-lg text-foreground">
                        <SmartCurrency 
                            amount={subscription.amount} 
                            currency={subscription.currency} 
                            visible={true} 
                            size="default" 
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                     {/* Status Indicator */}
                     <div className={cn(
                         "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border",
                         isActive 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                            : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                     )}>
                         <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-500 animate-pulse" : "bg-zinc-400")} />
                         {subscription.status}
                     </div>

                     {/* Actions Toggle */}
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                            "h-9 w-9 transition-colors rounded-xl",
                            isActive 
                                ? "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                        )}
                        onClick={handleToggleStatus}
                        disabled={isLoading}
                        title={isActive ? "Pause Subscription" : "Resume Subscription"}
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
        </div>
      </Card>
    </div>
  );
}