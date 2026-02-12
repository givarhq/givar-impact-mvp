import { cookies } from 'next/headers';
import Link from 'next/link';
import { Plus, ClipboardList, TrendingUp, Inbox, FileBox } from 'lucide-react';
import { ApiService } from '../../../../services/api';
import { Button } from '../../../../components/ui/button';
import { AdminProjectFilters } from '../../../../components/features/admin/admin-project-filters';
import { AdminProjectTable } from '../../../../components/features/admin/admin-project-table';
import { AdminProposalTable } from '../../../../components/features/admin/admin-proposal-table';
import { Pagination } from '../../../../components/features/history/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';

export const metadata = {
    title: 'Cause management',
    description: 'Oversee live projects, review drafts, and manage incoming proposals.',
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
    const activeTab = (resolvedParams.tab as string) || 'live';

    const projectParams = new URLSearchParams();
    Object.entries(resolvedParams).forEach(([key, value]) => {
        if (value && key !== 'tab') projectParams.set(key, String(value));
    });

    if (activeTab === 'drafts') {
        projectParams.set('status', 'DRAFT');
    } else if (activeTab === 'live') {
        if (!projectParams.has('status')) {
            projectParams.set('excludeDrafts', 'true');
        }
    }

    const proposalParams = new URLSearchParams();
    Object.entries(resolvedParams).forEach(([key, value]) => {
        if (value && key !== 'tab') proposalParams.set(key, String(value));
    });

    const [projectResult, proposalResult, categories] = await Promise.all([
        ApiService.admin.getProjects(token, projectParams),
        ApiService.admin.getProposals(token, proposalParams),
        ApiService.projects.getCategories(token)
    ]);

    const projects = projectResult?.data || [];
    const proposals = proposalResult?.data || [];

    const activeMeta = activeTab === 'proposals'
        ? (proposalResult?.meta || { page: 1, lastPage: 1 })
        : (projectResult?.meta || { page: 1, lastPage: 1 });

    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">

            {/* Title and Global Actions Row */}
            <div className="w-full min-w-0">
                <AdminProjectFilters categories={categories || []} activeTab={activeTab} />
            </div>

            <Tabs value={activeTab} className="w-full space-y-6 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
                    <TabsList className="bg-muted/50 p-1 rounded-3xl h-12 w-full md:w-fit border border-border/40 shadow-inner shrink-0">
                        <Link href="?tab=live" className="flex-1 md:flex-none h-full">
                            <TabsTrigger
                                value="live"
                                className="w-full md:w-[120px] h-full rounded-2xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                            >
                                <TrendingUp className="h-3.5 w-3.5" /> Live
                            </TabsTrigger>
                        </Link>
                        <Link href="?tab=drafts" className="flex-1 md:flex-none h-full">
                            <TabsTrigger
                                value="drafts"
                                className="w-full md:w-[120px] h-full rounded-2xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                            >
                                <FileBox className="h-3.5 w-3.5" /> Drafts
                            </TabsTrigger>
                        </Link>
                        <Link href="?tab=proposals" className="flex-1 md:flex-none h-full">
                            <TabsTrigger
                                value="proposals"
                                className="w-full md:w-[120px] h-full rounded-2xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                            >
                                <ClipboardList className="h-3.5 w-3.5" /> Proposals
                            </TabsTrigger>
                        </Link>
                    </TabsList>

                    <Link href="/admin/projects/new" className="shrink-0 w-full md:w-auto">
                        <Button className="w-full md:w-auto rounded-3xl font-bold bg-primary text-white shadow-lg shadow-primary/20 h-12 px-8 border-0 active:scale-95 transition-all">
                            <Plus className="mr-2 h-4 w-4" /> New project
                        </Button>
                    </Link>
                </div>

                {/* Table View Container */}
                <div className="w-full min-w-0 overflow-hidden">
                    <TabsContent value="live" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AdminProjectTable
                            projects={projects}
                            currentSort={String(resolvedParams.sortBy || 'createdAt')}
                            currentOrder={String(resolvedParams.sortOrder || 'desc')}
                        />
                    </TabsContent>

                    <TabsContent value="drafts" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {projects.length === 0 ? (
                            <div className="py-24 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5 min-w-0">
                                <Inbox className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-3" />
                                <h3 className="text-sm font-bold text-foreground opacity-60 tracking-tight">No drafts found</h3>
                                <p className="text-xs text-muted-foreground mt-1 font-medium">Any projects saved as drafts will appear here.</p>
                            </div>
                        ) : (
                            <AdminProjectTable
                                projects={projects}
                                currentSort={String(resolvedParams.sortBy || 'createdAt')}
                                currentOrder={String(resolvedParams.sortOrder || 'desc')}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="proposals" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AdminProposalTable proposals={proposals} />
                    </TabsContent>
                </div>

                <div className="pt-4 border-t border-border/40 min-w-0">
                    <Pagination currentPage={activeMeta.page} totalPages={activeMeta.lastPage} />
                </div>
            </Tabs>
        </div>
    );
}