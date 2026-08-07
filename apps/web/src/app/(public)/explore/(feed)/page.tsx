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

    const isSmartDiscovery = !params.has('search') && !params.has('sort') && !params.has('category');

    let projects: any[] = [];
    let groupedProjects: any[] = [];
    let completedProjects: any[] = [];
    let meta = { total: 0, page: 1, lastPage: 1 };

    // Initial Server-Side Fetch
    if (isSmartDiscovery) {
        const [groupedFeedRes, completedRes] = await Promise.all([
            ApiService.recommendations.getGroupedFeed(token),
            ApiService.projects.list(token || '', new URLSearchParams({ limit: '4', status: 'COMPLETED' }))
        ]);
        groupedProjects = groupedFeedRes || [];
        completedProjects = completedRes?.data || [];
    } else {
        const projectsResult = await ApiService.projects.list(token || '', params);
        projects = projectsResult?.data || [];
        meta = projectsResult?.meta || meta;
    }

    const categories = await ApiService.projects.getCategories(token);

    return (
        <PublicLayout variant="app">
            <div className="space-y-1 md:space-y-1 animate-in fade-in duration-500 pb-20 min-w-0">
                {/* Header Section */}
                <div className="px-1">
                    <ImpactFilters
                        categories={categories || []}
                        totalCount={meta.total}
                        hideSearch={true}
                    />
                </div>

                {/* Optimized Discovery Grid */}
                <div className="min-h-[400px]">
                    {isSmartDiscovery ? (
                        <GroupedDiscoveryFeed
                            groupedData={groupedProjects}
                            completedProjects={completedProjects}
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