import { cookies } from 'next/headers';
import { OverviewCards } from '../../../components/features/dashboard/overview-cards';
import { RecentActivity } from '../../../components/features/dashboard/recent-activity';
import { DashboardGoalClient } from '../../../components/features/goals/dashboard-goal-client';
import { GivingGoal } from '../../../types';

// 1. Fetch Wallet
async function getWalletData(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) { return null; }
}

// 2. Fetch History
async function getHistory(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations/my-history`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch (e) { return []; }
}

// SOTA UPDATE: Fetch Active Goal
async function getActiveGoal(token: string): Promise<GivingGoal | null> {
    try {
        // Fetches MONTHLY goal by default. Can be extended to fetch YEARLY too.
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/goals/active?interval=MONTHLY`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) return null;
        return res.json();
      } catch (e) { return null; }
}

async function getUser() {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('givar_user')?.value;
    return userCookie ? JSON.parse(userCookie) : null;
}

export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('givar_token')?.value;
  const user = await getUser();

  if (!token) return <div>Unauthorized</div>;

  // SOTA UPDATE: Fetch all data in parallel
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
      
      {/* Page Title & Greeting */}
      <div className="md:hidden flex flex-col gap-1 mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user?.firstName || 'Giver'}.
        </p>
      </div>
      
      {/* 1. Overview Grid */}
      <OverviewCards 
        wallet={walletData || { balance: '0', currency: 'NGN' }} 
        totalImpact={totalImpactBigInt.toString()}
        donationCount={history.length}
      />

      {/* 2. Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {/* Main Column */}
         <div className="lg:col-span-2 space-y-6">
            <RecentActivity transactions={history.slice(0, 5)} />
         </div>

         {/* Side Column */}
         <div className="space-y-6">
            <DashboardGoalClient initialGoal={activeGoal} />
         </div>
      </div>
    </div>
  );
}