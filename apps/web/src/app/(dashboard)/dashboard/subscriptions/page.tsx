import { cookies } from 'next/headers';
import { Repeat } from 'lucide-react';
import { SubscriptionCard } from '../../../../components/features/subscriptions/subscription-card';
import { Card, CardContent } from '../../../../components/ui/card';

async function getSubscriptions(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations/subscriptions`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    return [];
  }
}

export default async function SubscriptionsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) return null;

  const subscriptions = await getSubscriptions(token);

  const activeSubs = subscriptions.filter((s: any) => s.status === 'ACTIVE');
  const inactiveSubs = subscriptions.filter((s: any) => s.status !== 'ACTIVE');

  return (
    <div className="space-y-8">
      {/* Mobile Title */}
      <div className="md:hidden">
        <h1 className="text-2xl font-bold tracking-tight">Recurring Donations</h1>
        <p className="text-sm text-muted-foreground">
          Manage your active and past subscriptions.
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <Card className="border-dashed">
            <CardContent className="h-[400px] flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Repeat className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">No Recurring Donations Yet</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                    Set up a recurring donation to a cause to see it here and automate your impact.
                </p>
            </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
            {activeSubs.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Active Subscriptions</h2>
                    <div className="grid gap-4">
                        {activeSubs.map((sub: any) => (
                            <SubscriptionCard key={sub.id} subscription={sub} />
                        ))}
                    </div>
                </div>
            )}

            {inactiveSubs.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Inactive Subscriptions</h2>
                    <div className="grid gap-4">
                        {inactiveSubs.map((sub: any) => (
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