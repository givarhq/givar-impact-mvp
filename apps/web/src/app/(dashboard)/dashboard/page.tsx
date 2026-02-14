import { cookies } from 'next/headers';
import { ApiService } from '../../../services/api';
import { redirect } from 'next/navigation';
import { DashboardHero } from '../../../components/features/dashboard/dashboard-hero';
import { FeaturedCarousel } from '../../../components/features/dashboard/featured-carousel';
import { DiscoveryFeed } from '../../../components/features/dashboard/discovery-feed';
import { PortfolioView } from '../../../components/features/dashboard/portfolio-view';
import { Tabs, TabsContent } from '../../../components/ui/tabs';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value || '';
  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab || 'discovery';

  const [
    dbUser,
    history,
    activeResponse,
    completedResponse,
    categories,
    wallet,
    activeGoal
  ] = await Promise.all([
    ApiService.auth.getMe(token),
    ApiService.donations.getHistory(token),
    ApiService.projects.list(token, new URLSearchParams({ limit: '10', status: 'ACTIVE' })),
    ApiService.projects.list(token, new URLSearchParams({ limit: '3', status: 'COMPLETED' })),
    ApiService.projects.getCategories(token),
    ApiService.wallet.get(token),
    ApiService.goals.getActive(token, 'MONTHLY'),
  ]);

  if (!dbUser) {
    redirect('/api/auth/clear-session');
  }

  const totalImpactBigInt = (history || []).reduce((acc: bigint, tx: any) => {
    return acc + BigInt(tx.amount || 0);
  }, 0n);

  const activeProjects = activeResponse?.data || [];
  const completedProjects = completedResponse?.data || [];

  // Explicitly ensure carousel only features ACTIVE projects
  const featured = activeProjects.filter(p => p.status === 'ACTIVE').slice(0, 3);
  const trending = activeProjects.slice(3, 10);

  return (
    <div className="animate-in fade-in duration-300">
      <Tabs defaultValue={activeTab} className="space-y-4 md:space-y-6">
        <DashboardHero
          firstName={dbUser.firstName}
          totalImpact={totalImpactBigInt.toString()}
          donationCount={history?.length || 0}
        />

        <TabsContent value="discovery" className="space-y-6 md:space-y-8 outline-none mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <FeaturedCarousel projects={featured} />

          <DiscoveryFeed
            trending={trending}
            completed={completedProjects}
            categories={categories || []}
          />
        </TabsContent>

        <TabsContent value="portfolio" className="outline-none mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <PortfolioView
            wallet={wallet || { balance: '0', currency: 'NGN' }}
            history={history || []}
            activeGoal={activeGoal}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}