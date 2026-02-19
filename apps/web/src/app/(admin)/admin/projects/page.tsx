import { cookies } from 'next/headers';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ApiService } from '../../../../services/api';
import { Button } from '../../../../components/ui/button';
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

            <div className="w-full space-y-6 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
                    <ProjectsPageClient
                        activeTab={activeTab}
                        projectData={projectData}
                        proposalData={proposalData}
                        searchParams={resolvedParams}
                    />

                    <Link href="/admin/projects/new" className="shrink-0 w-full md:w-auto">
                        <Button className="w-full md:w-auto rounded-3xl font-bold bg-primary text-white shadow-lg shadow-primary/20 h-12 px-8 border-0 active:scale-95 transition-all">
                            <Plus className="mr-2 h-4 w-4" /> New Project
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}