'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ClipboardList, TrendingUp, Inbox, FileBox } from 'lucide-react';
import { ApiService } from '../../../../services/api';
import { Button } from '../../../../components/ui/button';
import { AdminProjectFilters } from '../../../../components/features/admin/admin-project-filters';
import { AdminProjectTable } from '../../../../components/features/admin/admin-project-table';
import { AdminProposalTable } from '../../../../components/features/admin/admin-proposal-table';
import { Pagination } from '../../../../components/features/history/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { BulkActionsToolbar } from '../../../../components/features/admin/bulk-actions-toolbar';
import { getCookie } from 'cookies-next';

export default function AdminProjectsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [projectData, setProjectData] = useState<any>({ data: [], meta: { total: 0, page: 1, lastPage: 1 } });
    const [proposalData, setProposalData] = useState<any>({ data: [], meta: { total: 0, page: 1, lastPage: 1 } });
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const activeTab = searchParams.get('tab') || 'live';

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const token = getCookie('givar_token') as string;

            const projectParams = new URLSearchParams(searchParams.toString());
            projectParams.delete('tab');
            if (activeTab === 'drafts') {
                projectParams.set('status', 'DRAFT');
            } else if (activeTab === 'live') {
                if (!projectParams.has('status')) projectParams.set('excludeDrafts', 'true');
            }

            try {
                const [pRes, propRes, catRes] = await Promise.all([
                    ApiService.admin.getProjects(token, projectParams),
                    ApiService.admin.getProposals(token, new URLSearchParams(searchParams.toString())),
                    ApiService.projects.getCategories(token)
                ]);

                if (pRes) setProjectData(pRes);
                if (propRes) setProposalData(propRes);
                if (catRes) setCategories(catRes);
            } catch (error) {
                console.error("Fetch failed", error);
            } finally {
                setIsLoading(false);
                setSelectedIds([]); // Clear selection on tab/filter change
            }
        };

        fetchData();
    }, [searchParams, activeTab]);

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        params.set('page', '1');
        router.replace(`?${params.toString()}`);
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
    };

    const handleSelectAll = (checked: boolean, currentData: any[]) => {
        setSelectedIds(checked ? currentData.map((p: any) => p.id) : []);
    };

    const activeMeta = activeTab === 'proposals' ? proposalData.meta : projectData.meta;

    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="w-full min-w-0">
                <AdminProjectFilters categories={categories} activeTab={activeTab} />
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
                    <TabsList className="bg-muted/50 p-1 rounded-3xl h-12 w-full md:w-fit border border-border/40 shadow-inner shrink-0">
                        <TabsTrigger value="live" className="w-full md:w-[120px] h-full rounded-2xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                            <TrendingUp className="h-3.5 w-3.5" /> Live
                        </TabsTrigger>
                        <TabsTrigger value="drafts" className="w-full md:w-[120px] h-full rounded-2xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                            <FileBox className="h-3.5 w-3.5" /> Drafts
                        </TabsTrigger>
                        <TabsTrigger value="proposals" className="w-full md:w-[120px] h-full rounded-2xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                            <ClipboardList className="h-3.5 w-3.5" /> Proposals
                        </TabsTrigger>
                    </TabsList>

                    <Link href="/admin/projects/new" className="shrink-0 w-full md:w-auto">
                        <Button className="w-full md:w-auto rounded-3xl font-bold bg-primary text-white shadow-lg shadow-primary/20 h-12 px-8 border-0 active:scale-95 transition-all">
                            <Plus className="mr-2 h-4 w-4" /> New project
                        </Button>
                    </Link>
                </div>

                <div className="w-full min-w-0 overflow-hidden">
                    <TabsContent value="live" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AdminProjectTable
                            projects={projectData.data}
                            currentSort={searchParams.get('sortBy') || 'createdAt'}
                            currentOrder={searchParams.get('sortOrder') || 'desc'}
                            selectedIds={selectedIds}
                            onSelectRow={handleSelectRow}
                            onSelectAll={(checked) => handleSelectAll(checked, projectData.data)}
                        />
                    </TabsContent>

                    <TabsContent value="drafts" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AdminProjectTable
                            projects={projectData.data}
                            currentSort={searchParams.get('sortBy') || 'createdAt'}
                            currentOrder={searchParams.get('sortOrder') || 'desc'}
                            selectedIds={selectedIds}
                            onSelectRow={handleSelectRow}
                            onSelectAll={(checked) => handleSelectAll(checked, projectData.data)}
                        />
                    </TabsContent>

                    <TabsContent value="proposals" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AdminProposalTable
                            proposals={proposalData.data}
                            selectedIds={selectedIds}
                            onSelectRow={handleSelectRow}
                            onSelectAll={(checked) => handleSelectAll(checked, proposalData.data)}
                        />
                    </TabsContent>
                </div>

                <div className="pt-4 border-t border-border/40 min-w-0">
                    <Pagination currentPage={activeMeta.page} totalPages={activeMeta.lastPage} />
                </div>
            </Tabs>

            <BulkActionsToolbar
                selectedIds={selectedIds}
                onClear={() => setSelectedIds([])}
                context={activeTab === 'proposals' ? 'PROPOSAL' : 'PROJECT'}
            />
        </div>
    );
}