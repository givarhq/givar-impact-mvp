import { cookies } from 'next/headers';
import { OverviewCards } from '../../../../components/features/dashboard/overview-cards';
import { ImpactPortfolio } from '../../../../components/features/dashboard/impact-portfolio';
import { DashboardGoalClient } from '../../../../components/features/goals/dashboard-goal-client';
import { ApiService } from '../../../../services/api';
import { redirect } from 'next/navigation';

export default async function PortfolioPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) redirect('/login');

    // Parallel fetching of personal impact data
    const [walletData, history, activeGoal, dbUser] = await Promise.all([
        ApiService.wallet.get(token),
        ApiService.donations.getHistory(token),
        ApiService.goals.getActive(token, 'MONTHLY'),
        ApiService.auth.getMe(token),
    ]);

    if (!dbUser) {
        redirect('/api/auth/clear-session');
    }

    const totalImpactBigInt = (history || []).reduce((acc: bigint, tx: any) => {
        return acc + BigInt(tx.amount || 0);
    }, 0n);

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black tracking-tight text-foreground">My Impact</h1>
                <p className="text-sm text-muted-foreground">
                    Track your personal giving history and goals.
                </p>
            </div>

            <OverviewCards
                wallet={walletData || { balance: '0', currency: 'NGN' }}
                totalImpact={totalImpactBigInt.toString()}
                donationCount={history?.length || 0}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ImpactPortfolio items={history || []} />
                </div>
                <div className="space-y-6">
                    <DashboardGoalClient initialGoal={activeGoal} />
                </div>
            </div>
        </div>
    );
}