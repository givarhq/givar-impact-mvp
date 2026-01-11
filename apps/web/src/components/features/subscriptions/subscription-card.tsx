'use client';

import { Repeat, PauseCircle, PlayCircle } from 'lucide-react';
import { cn } from '../../../lib/utils/cn';
import { formatCurrency, formatDate } from '../../../lib/utils/format';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Subscription } from '../../../types';

export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const isActive = subscription.status === 'ACTIVE';

  return (
    <Card className="p-5 rounded-2xl grid grid-cols-3 gap-4 items-center transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
      {/* Project Info */}
      <div className="col-span-3 sm:col-span-1 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden shrink-0">
          {subscription.project.imageUrl ? (
            <img 
              src={subscription.project.imageUrl} 
              alt={subscription.project.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary/50">
              <Repeat className="h-6 w-6" />
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-foreground truncate">{subscription.project.title}</p>
          <p className="text-xs text-muted-foreground">{subscription.interval.toLowerCase()}</p>
        </div>
      </div>

      {/* Amount & Status */}
      <div className="col-span-3 sm:col-span-1 space-y-1 text-center sm:text-left">
        <p className="font-semibold text-lg text-foreground">
          {formatCurrency(subscription.amount, subscription.currency)}
        </p>
        <div className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border", 
          isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        )}>
          <div className={cn("h-1.5 w-1.5 rounded-full", isActive ? 'bg-emerald-500' : 'bg-amber-500')} />
          {subscription.status}
        </div>
      </div>
      
      {/* Next Charge & Actions */}
      <div className="col-span-3 sm:col-span-1 flex flex-col items-center sm:items-end gap-2">
         <div className="text-center sm:text-right">
            <p className="text-xs text-muted-foreground">Next Charge</p>
            <p className="text-sm font-medium text-foreground">
                {formatDate(subscription.nextChargeDate).split(',')[0]}
            </p>
         </div>
         <Button variant={isActive ? "outline" : "secondary"} size="sm" className="w-full sm:w-auto">
            {isActive ? <PauseCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            {isActive ? 'Pause' : 'Resume'}
         </Button>
      </div>
    </Card>
  );
}