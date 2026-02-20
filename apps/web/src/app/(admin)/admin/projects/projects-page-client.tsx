'use client';

import React, { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ClipboardList, TrendingUp, FileBox } from 'lucide-react';
import { AdminProjectTable } from '../../../../components/features/admin/admin-project-table';
import { AdminProposalTable } from '../../../../components/features/admin/admin-proposal-table';
import { Pagination } from '../../../../components/features/history/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { BulkActionsToolbar } from '../../../../components/features/admin/bulk-actions-toolbar';
import { Button } from '../../../../components/ui/button';

interface ProjectsPageClientProps {
    activeTab: string;
    projectData: any;
    proposalData: any;
    searchParams: any;
}

export const ProjectsPageClient = memo(function ProjectsPageClient({
    activeTab,
    projectData,
    proposalData,
    searchParams
}: ProjectsPageClientProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        setSelectedIds([]);
    }, [activeTab, searchParams]);

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(window.location.search);
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
        <div className="w-full min-w-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
                    <TabsList className="bg-muted/50 p-1 rounded-3xl h-12 w-full md:w-auto border border-border/40 shadow-inner shrink-0 overflow-x-auto no-scrollbar justify-start">
                        <TabsTrigger value="live" className="flex-1 md:w-[120px] px-4 h-full rounded-2xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                            <TrendingUp className="h-3.5 w-3.5" /> Live
                        </TabsTrigger>
                        <TabsTrigger value="drafts" className="flex-1 md:w-[120px] px-4 h-full rounded-2xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                            <FileBox className="h-3.5 w-3.5" /> Drafts
                        </TabsTrigger>
                        <TabsTrigger value="proposals" className="flex-1 md:w-[120px] px-4 h-full rounded-2xl gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                            <ClipboardList className="h-3.5 w-3.5" /> Proposals
                        </TabsTrigger>
                    </TabsList>

                    <Link href="/admin/projects/new" className="shrink-0 w-full md:w-auto">
                        <Button className="w-full md:w-auto rounded-3xl font-bold bg-primary text-white shadow-lg shadow-primary/20 h-12 px-8 border-0 active:scale-95 transition-all">
                            <Plus className="mr-2 h-4 w-4" /> New Project
                        </Button>
                    </Link>
                </div>

                <div className="w-full min-w-0 overflow-hidden">
                    <TabsContent value="live" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AdminProjectTable
                            projects={projectData.data}
                            currentSort={searchParams.sortBy || 'createdAt'}
                            currentOrder={searchParams.sortOrder || 'desc'}
                            selectedIds={selectedIds}
                            onSelectRow={handleSelectRow}
                            onSelectAll={(checked) => handleSelectAll(checked, projectData.data)}
                        />
                    </TabsContent>

                    <TabsContent value="drafts" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AdminProjectTable
                            projects={projectData.data}
                            currentSort={searchParams.sortBy || 'createdAt'}
                            currentOrder={searchParams.sortOrder || 'desc'}
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
});