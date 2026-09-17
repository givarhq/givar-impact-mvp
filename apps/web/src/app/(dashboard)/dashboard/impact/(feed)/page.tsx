import { cookies } from 'next/headers';
import { ApiService } from '../../../../../services/api';
import { ImpactFilters } from '../../../../../components/features/impact/impact-filters';
import { InfiniteDiscoveryGrid } from '../../../../../components/features/impact/infinite-discovery-grid';
import { GroupedDiscoveryFeed } from '../../../../../components/features/impact/grouped-discovery-feed';

export default async function ImpactPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value || '';

    const resolvedParams = await searchParams;
    const params = new URLSearchParams(resolvedParams as any);

    // Logic: Smart Discovery applies ONLY on default active view with no filters/search
    const isSmartDiscovery = !params.has('search') && !params.has('sort') && !params.has('category') && !params.has('status');

    let projects: any[] = [];
    let groupedProjects: any[] = [];
    let completedProjects: any[] = [];
    let meta = { total: 0, page: 1, lastPage: 1 };

    // Fetch initial data
    if (isSmartDiscovery) {
        const groupedFeedRes = await ApiService.recommendations.getGroupedFeed(token);
        groupedProjects = groupedFeedRes?.groups || [];
        completedProjects = groupedFeedRes?.completed || [];
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
                {isSmartDiscovery ? (
                    <GroupedDiscoveryFeed
                        groupedData={groupedProjects}
                        completedProjects={completedProjects}
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