import { cookies } from 'next/headers';
import { Repeat, ArrowRight, Inbox } from 'lucide-react';
import Link from 'next/link';
import { SubscriptionCard } from '../../../../components/features/subscriptions/subscription-card';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { ApiService } from '../../../../services/api';
import { Subscription } from '../../../../types';

export const metadata = {
    title: 'Recurring Donations',
    description: 'Manage your automated impact portfolio and active subscriptions.',
};

export const dynamic = 'force-dynamic';

export default async function SubscriptionsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) return null;

    const subscriptions: Subscription[] = (await ApiService.donations.getSubscriptions(token)) || [];

    const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
    const inactiveSubs = subscriptions.filter((s) => s.status !== 'ACTIVE');

    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">

            {/* Mobile Title */}
            <div className="md:hidden px-1">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Recurring Donations</h1>
            </div>

            {subscriptions.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-20 md:py-32 text-center border-2 border-dashed border-border/40 rounded-[32px] bg-muted/5 min-w-0">
                    <div className="h-16 w-16 rounded-[24px] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
                        <Repeat className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-2 max-w-xs mx-auto min-w-0">
                        <h3 className="text-lg font-bold text-foreground tracking-tight">No active subscriptions</h3>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            Automate your impact. Choose a cause and set up a weekly or monthly donation to see it here.
                        </p>
                    </div>
                    <div className="mt-8">
                        <Link href="/dashboard/impact">
                            <Button className="h-12 rounded-3xl px-10 font-bold text-sm tracking-widest shadow-lg shadow-primary/20 gap-2 active:scale-[0.98] transition-all border-0">
                                Explore Causes <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </Card>
            ) : (
                <div className="space-y-10 min-w-0">
                    {/* Active Section */}
                    {activeSubs.length > 0 && (
                        <div className="space-y-4 min-w-0">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Active subscriptions
                                </h2>
                                <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-3xl border border-border/40 uppercase tracking-tight">
                                    {activeSubs.length} running
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:gap-4 min-w-0">
                                {activeSubs.map((sub) => (
                                    <div key={sub.id} className="min-w-0 flex-1">
                                        <SubscriptionCard subscription={sub} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Inactive Section */}
                    {inactiveSubs.length > 0 && (
                        <div className="space-y-4 pt-6 border-t border-border/40 min-w-0">
                            <div className="px-1">
                                <h2 className="text-sm font-bold text-muted-foreground">Past subscriptions</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:gap-4 min-w-0">
                                {inactiveSubs.map((sub) => (
                                    <div key={sub.id} className="min-w-0 flex-1 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                        <SubscriptionCard subscription={sub} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}