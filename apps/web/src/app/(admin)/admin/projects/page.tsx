import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { AdminProjectFilters } from '../../../../components/features/admin/admin-project-filters';
import { ProjectsPageClient } from './projects-page-client';

export const metadata = {
    title: 'Cause Management',
    description: 'Oversee project lifecycles, approvals, and compliance.',
};

export default async function AdminProjectsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;
    if (!token) return null;

    const resolvedParams = await searchParams;
    const activeTab = String(resolvedParams.tab || 'live');

    // Parallel Fetching: Projects + Categories + Proposals (if needed)
    // This ensures the page is ready in one pass, activating the skeleton.

    const projectParams = new URLSearchParams();
    // Map all known filters
    Object.entries(resolvedParams).forEach(([k, v]) => {
        if (v) projectParams.set(k, String(v));
    });

    // Specific Tab Logic
    projectParams.delete('tab');
    if (activeTab === 'drafts') {
        projectParams.set('status', 'DRAFT');
    } else if (activeTab === 'live') {
        if (!projectParams.has('status')) projectParams.set('excludeDrafts', 'true');
    }

    // Determine what to fetch based on tab
    const categoriesPromise = ApiService.projects.getCategories(token);
    let projectsPromise: Promise<any> = Promise.resolve({ data: [], meta: { total: 0, page: 1, lastPage: 1 } });
    let proposalsPromise: Promise<any> = Promise.resolve({ data: [], meta: { total: 0, page: 1, lastPage: 1 } });

    if (activeTab === 'proposals') {
        proposalsPromise = ApiService.admin.getProposals(token, new URLSearchParams(resolvedParams as any));
    } else {
        projectsPromise = ApiService.admin.getProjects(token, projectParams);
    }

    const [categories, projectData, proposalData] = await Promise.all([
        categoriesPromise,
        projectsPromise,
        proposalsPromise
    ]);

    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="w-full min-w-0">
                <AdminProjectFilters categories={categories || []} activeTab={activeTab} />
            </div>

            <div className="w-full min-w-0">
                <ProjectsPageClient
                    activeTab={activeTab}
                    projectData={projectData}
                    proposalData={proposalData}
                    searchParams={resolvedParams}
                />
            </div>
        </div>
    );
}