import { PublicLayout } from '../../../../components/layout/public-layout';
import { ImpactFilters } from '../../../../components/features/impact/impact-filters';
import { InfiniteDiscoveryGrid } from '../../../../components/features/impact/infinite-discovery-grid';
import { GroupedDiscoveryFeed } from '../../../../components/features/impact/grouped-discovery-feed';
import { ApiService } from '../../../../services/api';
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

    const currentStatus = params.get('status') || 'ACTIVE';

    // Smart Discovery (Grouped Rows) applies ONLY when viewing Active Causes with no search, sort, or category filter
    const isSmartDiscovery = currentStatus === 'ACTIVE' && !params.has('search') && !params.has('sort') && !params.has('category');

    let projects: any[] = [];
    let groupedProjects: any[] = [];
    let meta = { total: 0, page: 1, lastPage: 1 };

    // Initial Server-Side Fetch
    if (isSmartDiscovery) {
        const groupedFeedRes = await ApiService.recommendations.getGroupedFeed(token);
        groupedProjects = groupedFeedRes?.groups || [];
    } else {
        // Explicitly set the status param before querying the database
        params.set('status', currentStatus);
        const projectsResult = await ApiService.projects.list(token || '', params);
        projects = projectsResult?.data || [];
        meta = projectsResult?.meta || meta;
    }

    const categories = await ApiService.projects.getCategories(token);

    return (
        <PublicLayout variant="app">
            <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20 min-w-0">
                {/* Header Section */}
                <div className="px-1">
                    <ImpactFilters
                        categories={categories || []}
                        totalCount={meta.total}
                    />
                </div>

                {/* Discovery Grid */}
                <div className="min-h-[400px]">
                    {isSmartDiscovery ? (
                        <GroupedDiscoveryFeed
                            groupedData={groupedProjects}
                            completedProjects={[]} // Never pass completed causes to the active view
                            isPublic={true}
                        />
                    ) : (
                        <InfiniteDiscoveryGrid
                            initialData={projects}
                            initialMeta={meta}
                            isSmartDiscovery={false}
                            searchParams={params.toString()}
                            isPublic={true}
                        />
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}