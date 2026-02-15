import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { ImpactFilters } from '../../../../components/features/impact/impact-filters';
import { InfiniteDiscoveryGrid } from '../../../../components/features/impact/infinite-discovery-grid';

export default async function ImpactPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value || '';

  const resolvedParams = await searchParams;
  const params = new URLSearchParams(resolvedParams as any);

  // Logic: Identify Smart Discovery Context
  const isSmartDiscovery = !params.has('search') && !params.has('sort') && !params.has('category');

  let projects: any[] = [];
  let meta = { total: 0, page: 1, lastPage: 1 };

  // Fetch initial Page 1 on the Server for instant paint
  if (isSmartDiscovery) {
    const response = await ApiService.recommendations.getFeed(token, 1, 24);
    projects = response?.data || [];
    meta = response?.meta || meta;
  } else {
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
        />
      </div>

      <div className="min-h-[400px]">
        {/* Pass server data to the Infinite Grid for client-side expansion */}
        <InfiniteDiscoveryGrid
          initialData={projects}
          initialMeta={meta}
          isSmartDiscovery={isSmartDiscovery}
          searchParams={params.toString()}
        />
      </div>
    </div>
  );
}