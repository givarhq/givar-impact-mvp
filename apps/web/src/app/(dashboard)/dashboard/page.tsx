import { cookies } from 'next/headers';
import { OverviewCards } from '../../../components/features/dashboard/overview-cards';
import { RecentActivity } from '../../../components/features/dashboard/recent-activity';
import { DashboardGoalClient } from '../../../components/features/goals/dashboard-goal-client';
import { GivingGoal } from '../../../types';

async function getWalletData(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (e) { return null; }
}

async function getHistory(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations/my-history`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch (e) { return []; }
}

async function getActiveGoal(token: string): Promise<GivingGoal | null> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/goals/active?interval=MONTHLY`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      } catch (e) { return null; }
}

async function getUser() {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('givar_user')?.value;
    return userCookie ? JSON.parse(userCookie) : null;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  const user = await getUser();

  if (!token) return <div>Unauthorized</div>;

  const [walletData, history, activeGoal] = await Promise.all([
    getWalletData(token),
    getHistory(token),
    getActiveGoal(token),
  ]);

  const totalImpactBigInt = history.reduce((acc: bigint, tx: any) => {
    return acc + BigInt(tx.amount);
  }, 0n);

  return (
    <div className="space-y-6">
      
      <div className="md:hidden flex flex-col gap-1 mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user?.firstName || 'Giver'}.
        </p>
      </div>
      
      <OverviewCards 
        wallet={walletData || { balance: '0', currency: 'NGN' }} 
        totalImpact={totalImpactBigInt.toString()}
        donationCount={history.length}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
            <RecentActivity transactions={history.slice(0, 5)} />
         </div>

         <div className="space-y-6">
            <DashboardGoalClient initialGoal={activeGoal} />
         </div>
      </div>
    </div>
  );
}