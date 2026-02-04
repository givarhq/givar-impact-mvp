import { cookies } from 'next/headers';
import Link from 'next/link';
import { OverviewCards } from '../../../components/features/dashboard/overview-cards';
import { ImpactPortfolio } from '../../../components/features/dashboard/impact-portfolio';
import { DashboardGoalClient } from '../../../components/features/goals/dashboard-goal-client';
import { ApiService } from '../../../services/api';
import { Button } from '../../../components/ui/button';
import { ShieldAlert, ArrowRight, MailWarning } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) redirect('/login');

  // Parallel fetching with internal error shielding
  const [walletData, history, activeGoal, orgProfile, dbUser] = await Promise.all([
    ApiService.wallet.get(token),
    ApiService.donations.getHistory(token),
    ApiService.goals.getActive(token, 'MONTHLY'),
    ApiService.organizations.getMe(token),
    ApiService.auth.getMe(token),
  ]);

  // If dbUser fetch failed (401), exit immediately to clear session
  if (!dbUser) {
    redirect('/api/auth/clear-session');
  }

  const totalImpactBigInt = (history || []).reduce((acc: bigint, tx: any) => {
    return acc + BigInt(tx.amount || 0);
  }, 0n);

  const isEmailVerified = dbUser?.emailVerified;
  const isOrganizer = dbUser?.accountType === 'ORGANIZER';
  const isOrgVerified = orgProfile?.status === 'VERIFIED';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 -mt-4 -mb-2">
        <p className="text-sm text-muted-foreground">
          Welcome back, {dbUser?.firstName || 'Giver'}.
        </p>
      </div>

      {!isEmailVerified && (
        <div className="group relative rounded-2xl p-[1px] bg-gradient-to-r from-rose-500/50 via-rose-500/10 to-transparent animate-in slide-in-from-top-2 duration-500">
          <div className="relative bg-card rounded-[15px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-rose-500/10 shadow-xl shadow-rose-500/5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
                <MailWarning className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Verify your email</h4>
                <p className="text-xs text-muted-foreground">Transactional features (Donations & Funding) are locked until verification.</p>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 pr-2">Check your inbox</p>
          </div>
        </div>
      )}

      {isEmailVerified && isOrganizer && !isOrgVerified && (
        <div className="group relative rounded-2xl p-[1px] bg-gradient-to-r from-amber-500/50 via-amber-500/10 to-transparent animate-in slide-in-from-top-2 duration-500">
          <div className="relative bg-card rounded-[15px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-amber-500/10">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Verify your Organization</h4>
                <p className="text-xs text-muted-foreground">Verification is required to suggest new causes for Givar funding.</p>
              </div>
            </div>
            <Link href="/dashboard/verify">
              <Button size="sm" variant="secondary" className="rounded-xl h-9 px-4 text-xs font-bold gap-2 shadow-none border-0">
                Complete KYC <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      )}

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