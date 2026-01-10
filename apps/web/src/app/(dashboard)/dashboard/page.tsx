import { cookies } from 'next/headers';
import { WalletCard } from '../../../components/features/wallet/wallet-card';

// SOTA: Server-Side Data Fetching
async function getWalletData() {
  const cookieStore = cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store', // Always fetch fresh data (financial data)
    });

    if (!res.ok) throw new Error('Failed to fetch wallet');
    return res.json();
  } catch (error) {
    console.error('Wallet fetch error:', error);
    return null;
  }
}

async function getUser() {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('givar_user')?.value;
    return userCookie ? JSON.parse(userCookie) : null;
}

export default async function DashboardPage() {
  const walletData = await getWalletData();
  const user = await getUser();

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName || 'Giver'}. Here is your impact overview.
        </p>
      </div>

      {/* Hero Section: Wallet */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-2">
            <WalletCard 
                balance={walletData?.balance || '0'} 
                currency={walletData?.currency || 'NGN'} 
            />
        </div>
        
        {/* Placeholder for "Quick Impact" or Stats */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-2">
            <h3 className="text-muted-foreground font-medium">Total Impact</h3>
            <p className="text-3xl font-bold text-foreground">₦0.00</p>
            <p className="text-xs text-muted-foreground">Donated to 0 causes</p>
        </div>
      </div>

      {/* Recent Activity Skeleton */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
        <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="p-6 text-center text-sm text-muted-foreground">
                No transactions yet. Start by funding your wallet!
            </div>
        </div>
      </div>
    </div>
  );
}