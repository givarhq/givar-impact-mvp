import { PublicLayout } from '../../../components/layout/public-layout';
import { ImpactFilters } from '../../../components/features/impact/impact-filters';
import { InfiniteDiscoveryGrid } from '../../../components/features/impact/infinite-discovery-grid';
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

  // Logic: Only use Smart Discovery if no manual search/sort/category is active
  const isSmartDiscovery = !params.has('search') && !params.has('sort') && !params.has('category');

  let projects: any[] = [];
  let meta = { total: 0, page: 1, lastPage: 1 };

  // Initial Server-Side Fetch for SEO & Instant Interaction
  if (isSmartDiscovery) {
    const response = await ApiService.recommendations.getFeed(token, 1, 24);
    projects = response?.data || [];
    meta = response?.meta || meta;
  } else {
    // Standard fetch for filtered/searched states
    const projectsResult = await ApiService.projects.list(token || '', params);
    projects = projectsResult?.data || [];
    meta = projectsResult?.meta || meta;
  }

  const categories = await ApiService.projects.getCategories(token);

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 space-y-10 min-h-screen pb-24">
        {/* Header Section */}
        <div className="px-1">
          <ImpactFilters
            categories={categories || []}
            totalCount={meta.total}
          />
        </div>

        {/* Optimized Discovery Grid */}
        <div className="min-h-[400px]">
          <InfiniteDiscoveryGrid
            initialData={projects}
            initialMeta={meta}
            isSmartDiscovery={isSmartDiscovery}
            searchParams={params.toString()}
            isPublic={true}
          />
        </div>
      </div>
    </PublicLayout>
  );
}