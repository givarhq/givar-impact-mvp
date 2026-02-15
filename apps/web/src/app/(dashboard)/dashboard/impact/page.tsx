import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { ProjectGrid } from '../../../../components/features/impact/project-grid';
import { ImpactFilters } from '../../../../components/features/impact/impact-filters';

export default async function ImpactPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value || '';

  const resolvedParams = await searchParams;
  const params = new URLSearchParams(resolvedParams as any);

  // 1. Logic: Identify if Smart Discovery is applicable.
  // We use the recommendation feed ONLY if the user hasn't triggered manual filters (search, sort, or category).
  const isSmartDiscovery = !params.has('search') && !params.has('sort') && !params.has('category');

  let projects: any[] = [];
  let totalCount = 0;

  if (isSmartDiscovery) {
    // 2. Fetch from Recommendation Engine (Authenticated context for Personalization)
    const recommended = await ApiService.recommendations.getFeed(token);
    projects = recommended || [];
    totalCount = projects.length;
  } else {
    // 3. Fallback to standard Query Engine for specific searches
    const projectsResult = await ApiService.projects.list(token, params);
    projects = projectsResult?.data || [];
    totalCount = projectsResult?.meta?.total || 0;
  }

  const categories = await ApiService.projects.getCategories(token);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">

      <div className="space-y-6">
        <ImpactFilters
          categories={categories || []}
          totalCount={totalCount}
        />
      </div>

      <div className="min-h-[300px] pt-2">
        <ProjectGrid projects={projects} />
      </div>
    </div>
  );
}