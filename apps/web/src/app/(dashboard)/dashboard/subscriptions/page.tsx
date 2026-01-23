import { cookies } from 'next/headers';
import { Repeat, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SubscriptionCard } from '../../../../components/features/subscriptions/subscription-card';
import { Button } from '../../../../components/ui/button';
import { ApiService } from '../../../../services/api';
import { Subscription } from '../../../../types';

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function SubscriptionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) return null;

  const subscriptions: Subscription[] = (await ApiService.donations.getSubscriptions(token)) || [];

  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
  const inactiveSubs = subscriptions.filter((s) => s.status !== 'ACTIVE');

  return (
    <div className="space-y-8 min-h-screen pb-20">
      
      {/* Mobile Title */}
      <div className="md:hidden flex flex-col gap-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Recurring Donations</h1>
        <p className="text-sm text-muted-foreground">
          Manage your automated impact portfolio.
        </p>
      </div>

      {/* Empty State */}
      {subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-border rounded-3xl bg-card/30">
            <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 ring-8 ring-primary/5">
                <Repeat className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">No Active Subscriptions</h3>
            <p className="text-muted-foreground mt-3 max-w-md text-lg">
                Automate your impact. Choose a cause and set up a weekly or monthly donation to see it here.
            </p>
            <div className="mt-8">
                <Link href="/dashboard/impact">
                    <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
                        Explore Causes <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
      ) : (
        <div className="space-y-10">
            
            {/* Active Section */}
            {activeSubs.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Active Subscriptions
                        </h2>
                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                            {activeSubs.length} running
                        </span>
                    </div>
                    <div className="grid gap-4">
                        {activeSubs.map((sub) => (
                            <SubscriptionCard key={sub.id} subscription={sub} />
                        ))}
                    </div>
                </div>
            )}

            {/* Inactive Section */}
            {inactiveSubs.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                    <h2 className="text-lg font-bold text-muted-foreground">Past Subscriptions</h2>
                    <div className="grid gap-4 opacity-75 grayscale-[0.5] hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        {inactiveSubs.map((sub) => (
                            <SubscriptionCard key={sub.id} subscription={sub} />
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
}