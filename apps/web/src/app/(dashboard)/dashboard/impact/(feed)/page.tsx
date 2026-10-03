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

    const requestedStatus = params.get('status') as 'ACTIVE' | 'COMPLETED' | null;
    const isDefaultView = !params.has('search') && !params.has('sort') && !params.has('category') && !params.has('subcategory');

    let currentStatus: 'ACTIVE' | 'COMPLETED' = requestedStatus || 'ACTIVE';
    let isSmartDiscovery = false;
    let projects: any[] = [];
    let groupedProjects: any[] = [];
    let meta = { total: 0, page: 1, lastPage: 1 };

    if (!requestedStatus && isDefaultView) {
        // First check if active causes exist in the grouped feed
        const groupedFeedRes = await ApiService.recommendations.getGroupedFeed(token);
        const activeGroups = (groupedFeedRes?.groups || []).filter(
            (g: any) => g.projects && g.projects.length > 0
        );

        if (activeGroups.length > 0) {
            currentStatus = 'ACTIVE';
            isSmartDiscovery = true;
            groupedProjects = activeGroups;
        } else {
            // No active causes available -> default automatically to Completed
            currentStatus = 'COMPLETED';
            params.set('status', 'COMPLETED');
            const projectsResult = await ApiService.projects.list(token, params);
            projects = projectsResult?.data || [];
            meta = projectsResult?.meta || meta;
        }
    } else if (currentStatus === 'ACTIVE' && isDefaultView) {
        const groupedFeedRes = await ApiService.recommendations.getGroupedFeed(token);
        groupedProjects = (groupedFeedRes?.groups || []).filter(
            (g: any) => g.projects && g.projects.length > 0
        );
        isSmartDiscovery = true;
    } else {
        params.set('status', currentStatus);
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
                    initialStatus={currentStatus}
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