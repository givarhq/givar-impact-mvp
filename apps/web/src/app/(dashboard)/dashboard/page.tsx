import { cookies } from 'next/headers';
import { OverviewCards } from '../../../components/features/dashboard/overview-cards';
import { RecentActivity } from '../../../components/features/dashboard/recent-activity';

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

  const [walletData, history] = await Promise.all([
    getWalletData(token),
    getHistory(token),
  ]);

  const totalImpactBigInt = history.reduce((acc: bigint, tx: any) => {
    return acc + BigInt(tx.amount);
  }, 0n);

  return (
    <div className="space-y-6">
      
      {/* 
        Page Title & Greeting 
        - Visible on Mobile (default)
        - Hidden on Desktop (md:hidden) because Header handles it
      */}
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
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-semibold mb-2 text-sm">Impact Goals</h3>
                <p className="text-xs text-muted-foreground mb-4">
                    Set a monthly giving goal to track your progress and maximize impact.
                </p>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary w-[0%]" /> 
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground font-medium">Start</span>
                    <span className="text-[10px] text-muted-foreground font-medium">0%</span>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}