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
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">

            {/* 1. Header & Filters (Standardized Title/Search Row) */}
            <AdminProjectFilters categories={categories || []} activeTab={activeTab} />

            {/* 2. Global Actions & Tab Switcher */}
            <Tabs value={activeTab} className="w-full space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="bg-muted/50 p-1.5 rounded-[22px] h-14 w-full md:w-auto border border-border/40">
                        <Link href="?tab=live" className="flex-1 md:flex-none">
                            <TabsTrigger
                                value="live"
                                className="w-full md:w-[140px] h-full rounded-xl gap-2 font-bold text-[11px] uppercase tracking-widest data-[state=active]:shadow-lg"
                            >
                                <TrendingUp className="h-4 w-4" /> Live
                            </TabsTrigger>
                        </Link>
                        <Link href="?tab=drafts" className="flex-1 md:flex-none">
                            <TabsTrigger
                                value="drafts"
                                className="w-full md:w-[140px] h-full rounded-xl gap-2 font-bold text-[11px] uppercase tracking-widest data-[state=active]:shadow-lg"
                            >
                                <FileBox className="h-4 w-4" /> Drafts
                            </TabsTrigger>
                        </Link>
                        <Link href="?tab=proposals" className="flex-1 md:flex-none">
                            <TabsTrigger
                                value="proposals"
                                className="w-full md:w-[140px] h-full rounded-xl gap-2 font-bold text-[11px] uppercase tracking-widest data-[state=active]:shadow-lg"
                            >
                                <ClipboardList className="h-4 w-4" /> Proposals
                            </TabsTrigger>
                        </Link>
                    </TabsList>

                    <Link href="/admin/projects/new" className="shrink-0 w-full md:w-auto">
                        <Button className="w-full md:w-auto rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-14 px-6 border-0">
                            <Plus className="mr-2 h-5 w-5" /> New Project
                        </Button>
                    </Link>
                </div>

                {/* 3. Table Content */}
                <TabsContent value="live" className="mt-0 outline-none">
                    <AdminProjectTable
                        projects={projects}
                        currentSort={String(resolvedParams.sortBy || 'createdAt')}
                        currentOrder={String(resolvedParams.sortOrder || 'desc')}
                    />
                </TabsContent>

                <TabsContent value="drafts" className="mt-0 outline-none">
                    {projects.length === 0 ? (
                        <div className="py-24 text-center border-2 border-dashed border-border rounded-[32px] bg-muted/10">
                            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                            <h3 className="text-lg font-bold text-foreground opacity-60 uppercase tracking-widest">No Drafts Found</h3>
                        </div>
                    ) : (
                        <AdminProjectTable
                            projects={projects}
                            currentSort={String(resolvedParams.sortBy || 'createdAt')}
                            currentOrder={String(resolvedParams.sortOrder || 'desc')}
                        />
                    )}
                </TabsContent>

                <TabsContent value="proposals" className="mt-0 outline-none">
                    <AdminProposalTable proposals={proposals} />
                </TabsContent>

                <div className="pt-4 border-t border-border/40">
                    <Pagination currentPage={activeMeta.page} totalPages={activeMeta.lastPage} />
                </div>
            </Tabs>
        </div>
    );
}