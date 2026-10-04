import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { ImpactFilters } from '../../../../components/features/impact/impact-filters';
import { InfiniteDiscoveryGrid } from '../../../../components/features/impact/infinite-discovery-grid';
import { GroupedDiscoveryFeed } from '../../../../components/features/impact/grouped-discovery-feed';

export default async function ImpactPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value || '';

  const resolvedParams = await searchParams;
  const params = new URLSearchParams(resolvedParams as any);

  // 1. Direct database check: Do ANY active causes exist?
  const activeCheck = await ApiService.projects.list(token, new URLSearchParams({ status: 'ACTIVE', limit: '1' }));
  const hasActiveCauses = (activeCheck?.meta?.total || 0) > 0;

  // 2. Resolve requested status: If no active causes exist, default to COMPLETED
  const rawStatusParam = params.get('status') as 'ACTIVE' | 'COMPLETED' | null;
  let targetStatus: 'ACTIVE' | 'COMPLETED';

  if (!hasActiveCauses) {
    targetStatus = rawStatusParam === 'ACTIVE' ? 'ACTIVE' : 'COMPLETED';
  } else {
    targetStatus = rawStatusParam || 'ACTIVE';
  }

  const isDefaultView = !params.has('search') && !params.has('sort') && !params.has('category') && !params.has('subcategory');
  const isSmartDiscovery = targetStatus === 'ACTIVE' && isDefaultView;

  let projects: any[] = [];
  let groupedProjects: any[] = [];
  let meta = { total: 0, page: 1, lastPage: 1 };

  if (isSmartDiscovery) {
    const groupedFeedRes = await ApiService.recommendations.getGroupedFeed(token);
    groupedProjects = (groupedFeedRes?.groups || []).filter(
      (g: any) => g.projects && g.projects.length > 0
    );
  } else {
    params.set('status', targetStatus);
    const projectsResult = await ApiService.projects.list(token, params);
    projects = projectsResult?.data || [];
    meta = projectsResult?.meta || meta;
  }

  const categories = await ApiService.projects.getCategories(token);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="space-y-6">
        <ImpactFilters
          categories={categories || []}
          totalCount={meta.total}
          initialStatus={targetStatus}
          hasActiveCauses={hasActiveCauses}
        />
      </div>

      <div className="min-h-[400px]">
        {isSmartDiscovery ? (
          <GroupedDiscoveryFeed
            groupedData={groupedProjects}
            completedProjects={[]}
            isPublic={false}
          />
        ) : (
          <InfiniteDiscoveryGrid
            initialData={projects}
            initialMeta={meta}
            isSmartDiscovery={false}
            searchParams={params.toString()}
          />
        )}
      </div>
    </div>
  );
}