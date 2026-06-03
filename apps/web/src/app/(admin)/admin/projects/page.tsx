import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { AdminProjectFilters } from '../../../../components/features/admin/admin-project-filters';
import { AdminProposalFilters } from '../../../../components/features/admin/admin-proposal-filters';
import { ProjectsPageClient } from './projects-page-client';
import { Suspense } from 'react';

export const metadata = {
    title: 'Cause Management',
    description: 'Oversee project lifecycles, approvals, & compliance.',
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

    // Build params for Live/Draft Projects
    const projectParams = new URLSearchParams();
    Object.entries(resolvedParams).forEach(([k, v]) => {
        if (v) projectParams.set(k, String(v));
    });

    projectParams.delete('tab');
    if (activeTab === 'drafts') {
        projectParams.set('status', 'DRAFT');
    } else if (activeTab === 'live') {
        if (!projectParams.has('status')) projectParams.set('excludeDrafts', 'true');
    }

    const categoriesPromise = ApiService.projects.getCategories(token);
    let projectsPromise: Promise<any> = Promise.resolve({ data: [], meta: { total: 0, page: 1, lastPage: 1 } });
    let proposalsPromise: Promise<any> = Promise.resolve({ data: [], meta: { total: 0, page: 1, lastPage: 1 } });

    if (activeTab === 'proposals') {
        // Strip forbidden parameters to prevent Backend DTO Payload Pollution Rejections (400 Bad Request)
        const proposalParams = new URLSearchParams();
        Object.entries(resolvedParams).forEach(([k, v]) => {
            if (v && ['search', 'status', 'category', 'page', 'limit'].includes(k)) {
                proposalParams.set(k, String(v));
            }
        });
        proposalsPromise = ApiService.admin.getProposals(token, proposalParams);
    } else if (activeTab !== 'categories') {
        projectsPromise = ApiService.admin.getProjects(token, projectParams);
    }

    const [categories, projectData, proposalData] = await Promise.all([
        categoriesPromise,
        projectsPromise,
        proposalsPromise
    ]);

    const safeProjectData = projectData || { data: [], meta: { total: 0, page: 1, lastPage: 1 } };
    const safeProposalData = proposalData || { data: [], meta: { total: 0, page: 1, lastPage: 1 } };

    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">
            {activeTab !== 'categories' && (
                <div className="w-full min-w-0">
                    <Suspense fallback={<div className="h-10 w-full bg-muted/20 animate-pulse rounded-3xl" />}>
                        {activeTab === 'proposals' ? (
                            <AdminProposalFilters categories={categories || []} />
                        ) : (
                            <AdminProjectFilters categories={categories || []} activeTab={activeTab} />
                        )}
                    </Suspense>
                </div>
            )}

            <div className="w-full min-w-0">
                <Suspense fallback={<div className="h-64 w-full bg-muted/20 animate-pulse rounded-3xl" />}>
                    <ProjectsPageClient
                        activeTab={activeTab}
                        projectData={safeProjectData}
                        proposalData={safeProposalData}
                        searchParams={resolvedParams}
                    />
                </Suspense>
            </div>
        </div>
    );
}
