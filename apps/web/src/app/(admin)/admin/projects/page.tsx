import { cookies } from 'next/headers';
import Link from 'next/link';
import { Plus, ClipboardList, TrendingUp, Inbox } from 'lucide-react';
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
    const params = new URLSearchParams(resolvedParams as any);

    const [projectResult, proposalResult, categories] = await Promise.all([
        ApiService.admin.getProjects(token, params),
        ApiService.admin.getProposals(token, params),
        ApiService.projects.getCategories(token)
    ]);

    const projects = projectResult?.data || [];
    const proposals = proposalResult?.data || [];
    const activeMeta = activeTab === 'live' ? (projectResult?.meta || { page: 1, lastPage: 1 }) : (proposalResult?.meta || { page: 1, lastPage: 1 });

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-lg md:hidden font-black tracking-tight text-foreground">Cause Management</h1>
                    <p className="text-sm text-muted-foreground font-medium">Oversee the lifecycle of every impact project on the platform.</p>
                </div>
                <Link href="/admin/projects/new" className="shrink-0">
                    <Button className="rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 h-12 px-6 border-0">
                        <Plus className="mr-2 h-5 w-5" /> New Project
                    </Button>
                </Link>
            </div>

            <Tabs value={activeTab} className="w-full space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="bg-muted/50 p-1.5 rounded-[22px] h-14 w-full md:w-[400px] border border-border/40">
                        <Link href="?tab=live" className="flex-1">
                            <TabsTrigger
                                value="live"
                                className="w-full h-full rounded-xl gap-2 font-bold text-[11px] uppercase tracking-widest data-[state=active]:shadow-lg"
                            >
                                <TrendingUp className="h-4 w-4" /> Live Projects
                            </TabsTrigger>
                        </Link>
                        <Link href="?tab=proposals" className="flex-1">
                            <TabsTrigger
                                value="proposals"
                                className="w-full h-full rounded-xl gap-2 font-bold text-[11px] uppercase tracking-widest data-[state=active]:shadow-lg"
                            >
                                <ClipboardList className="h-4 w-4" /> Proposal Pipeline
                            </TabsTrigger>
                        </Link>
                    </TabsList>

                    <div className="hidden lg:flex items-center gap-2 bg-card px-4 py-2 rounded-2xl border border-border/50 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {activeTab === 'live' ? `${projects.length} Entries Loaded` : `${proposals.length} In Pipeline`}
                        </span>
                    </div>
                </div>

                <AdminProjectFilters categories={categories || []} activeTab={activeTab} />

                <TabsContent value="live" className="mt-0 outline-none">
                    <AdminProjectTable
                        projects={projects}
                        currentSort={String(resolvedParams.sortBy || 'createdAt')}
                        currentOrder={String(resolvedParams.sortOrder || 'desc')}
                    />
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