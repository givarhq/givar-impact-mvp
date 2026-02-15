import { PublicLayout } from '../../../components/layout/public-layout';
import { ProjectGrid } from '../../../components/features/impact/project-grid';
import { ImpactFilters } from '../../../components/features/impact/impact-filters';
import { ApiService } from '../../../services/api';
import { cookies } from 'next/headers';

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const params = new URLSearchParams(resolvedParams as any);
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  // 1. Logic: If no specific search or manual sort is applied, 
  // use the smart Recommendation Feed for high-utility discovery.
  const isSmartDiscovery = !params.has('search') && !params.has('sort') && !params.has('category');

  let projects: any[] = [];
  let totalCount = 0;

  if (isSmartDiscovery) {
    const recommended = await ApiService.recommendations.getFeed(token);
    projects = recommended || [];
    totalCount = projects.length;
  } else {
    // 2. Logic: If user applies manual filters, fall back to the standard search engine
    const projectsResult = await ApiService.projects.list(token || '', params);
    projects = projectsResult?.data || [];
    totalCount = projectsResult?.meta?.total || 0;
  }

  const categories = await ApiService.projects.getCategories(token);

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 space-y-10 min-h-screen pb-24">
        {/* Header Section */}
        <div className="px-1">
          <ImpactFilters
            categories={categories || []}
            totalCount={totalCount}
          />
          {isSmartDiscovery && projects.length > 0 && (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-4 flex items-center gap-2 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Smart discovery active
            </p>
          )}
        </div>

        {/* Results Section */}
        <div className="min-h-[400px]">
          <ProjectGrid projects={projects} isPublic={true} />
        </div>
      </div>
    </PublicLayout>
  );
}