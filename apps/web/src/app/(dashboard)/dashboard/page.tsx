import { cookies } from 'next/headers';
import { ApiService } from '../../../services/api';
import { redirect } from 'next/navigation';
import { DashboardHero } from '../../../components/features/dashboard/dashboard-hero';
import { FeaturedCarousel } from '../../../components/features/dashboard/featured-carousel';
import { DiscoveryFeed } from '../../../components/features/dashboard/discovery-feed';
import { PortfolioView } from '../../../components/features/dashboard/portfolio-view';
import { Tabs, TabsContent } from '../../../components/ui/tabs';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
    featuredResponse,
    groupedFeed,
    completedResponse,
    activeGoal
  ] = await Promise.all([
    ApiService.auth.getMe(token),
    ApiService.donations.getHistory(token),
    ApiService.recommendations.getFeatured(token),
    ApiService.recommendations.getGroupedFeed(token),
    ApiService.projects.list(token, new URLSearchParams({ limit: '4', status: 'COMPLETED' })),
    ApiService.goals.getActive(token, 'MONTHLY'),
  ]);

  if (!dbUser) {
    redirect('/api/auth/clear-session');
  }

  const totalImpactBigInt = (history || []).reduce((acc: bigint, tx: any) => {
    return acc + BigInt(tx.amount || 0);
  }, 0n);

  const featuredProjects = featuredResponse?.data || [];
  const completedProjects = completedResponse?.data || [];

  return (
    <div className="animate-in fade-in duration-300">
      <Tabs defaultValue={activeTab} className="space-y-4 md:space-y-6">
        <DashboardHero
          firstName={dbUser.firstName}
          totalImpact={totalImpactBigInt.toString()}
          donationCount={history?.length || 0}
        />

        <TabsContent value="discovery" className="space-y-4 md:space-y-6 outline-none mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <FeaturedCarousel projects={featuredProjects} />

          <DiscoveryFeed
            groupedTrending={groupedFeed}
            completed={completedProjects}
          />

          <div className="flex justify-center py-6">
            <Link
              href="/dashboard/impact"
              className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors tracking-wide"
            >
              View all
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="outline-none mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <PortfolioView
            wallet={{ balance: '0', currency: 'NGN', id: '', userId: '' }}
            history={history || []}
            activeGoal={activeGoal}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}