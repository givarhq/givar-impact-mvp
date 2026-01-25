import { cookies } from 'next/headers';
import { OverviewCards } from '../../../components/features/dashboard/overview-cards';
import { ImpactPortfolio } from '../../../components/features/dashboard/impact-portfolio';
import { DashboardGoalClient } from '../../../components/features/goals/dashboard-goal-client';
import { ApiService } from '../../../services/api';

async function getUser() {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('givar_user')?.value;

    if (!userCookie || userCookie === 'undefined') return null;

    try {
        return JSON.parse(userCookie);
    } catch (err) {
        console.warn('Failed to parse givar_user cookie:', userCookie);
        return null;
    }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  const user = await getUser();

  if (!token) return <div>Unauthorized</div>;

  const [walletData, history, activeGoal] = await Promise.all([
    ApiService.wallet.get(token),
    ApiService.donations.getHistory(token),
    ApiService.goals.getActive(token, 'MONTHLY'),
  ]);

  const totalImpactBigInt = (history || []).reduce((acc: bigint, tx: any) => {
    return acc + BigInt(tx.amount);
  }, 0n);

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col gap-1 -mt-4 -mb-2">
        <p className="text-sm text-muted-foreground">
          Welcome back, {user?.firstName || 'Giver'}.
        </p>
      </div>
      
      <OverviewCards 
        wallet={walletData || { balance: '0', currency: 'NGN' }} 
        totalImpact={totalImpactBigInt.toString()}
        donationCount={history?.length || 0}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         
         <ImpactPortfolio items={history || []} />

         <div className="space-y-6">
            <DashboardGoalClient initialGoal={activeGoal} />
         </div>
      </div>
    </div>
  );
}