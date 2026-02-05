import { cookies } from 'next/headers';
import { ApiService } from '../../../services/api';
import { redirect } from 'next/navigation';
import { DashboardHero } from '../../../components/features/dashboard/dashboard-hero';
import { FeaturedCarousel } from '../../../components/features/dashboard/featured-carousel';
import { DiscoveryFeed } from '../../../components/features/dashboard/discovery-feed';

export default async function DiscoveryHomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value || '';

  const [
    dbUser,
    history,
    activeResponse,
    completedResponse,
    categories
  ] = await Promise.all([
    ApiService.auth.getMe(token),
    ApiService.donations.getHistory(token),
    ApiService.projects.list(token, new URLSearchParams({ limit: '6', status: 'ACTIVE' })),
    ApiService.projects.list(token, new URLSearchParams({ limit: '3', status: 'COMPLETED' })),
    ApiService.projects.getCategories(token)
  ]);

  if (!dbUser) {
    redirect('/api/auth/clear-session');
  }

  const totalImpactBigInt = (history || []).reduce((acc: bigint, tx: any) => {
    return acc + BigInt(tx.amount || 0);
  }, 0n);

  const activeProjects = activeResponse?.data || [];
  const completedProjects = completedResponse?.data || [];
  const featured = activeProjects.slice(0, 3);
  const trending = activeProjects.slice(3, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">

      {/* 1. Impact Intelligence Bar */}
      <DashboardHero
        firstName={dbUser.firstName}
        totalImpact={totalImpactBigInt.toString()}
        donationCount={history?.length || 0}
      />

      {/* 2. Featured Content */}
      <section className="pt-2">
        <FeaturedCarousel projects={featured} />
      </section>

      {/* 3. Discovery Engine */}
      <DiscoveryFeed
        trending={trending}
        completed={completedProjects}
        categories={categories || []}
      />
    </div>
  );
}