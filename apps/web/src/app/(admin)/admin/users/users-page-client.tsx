'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserTable } from '../../../../components/features/admin/user-table';
import { BulkActionsToolbar } from '../../../../components/features/admin/bulk-actions-toolbar';
import { Pagination } from '../../../../components/features/history/pagination';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';
import { Users, ShieldAlert } from 'lucide-react';

interface UsersPageClientProps {
    initialData: { data: any[]; meta: any };
    activeTab: string;
    searchParams: any;
}

export function UsersPageClient({ initialData, activeTab, searchParams }: UsersPageClientProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Logic: Reset selection when data source changes
    useEffect(() => {
        setSelectedIds([]);
    }, [initialData]);

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(window.location.search);
        params.set('tab', value);
        params.set('page', '1');
        // Clear filters to prevent context mismatch
        params.delete('role');
        params.delete('accountType');
        params.delete('status');
        params.delete('search');

        router.replace(`?${params.toString()}`);
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
    };

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? initialData.data.map((u: any) => u.id) : []);
    };

    return (
        <>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6 min-w-0">
                <div className="w-full min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="bg-muted/50 p-1 rounded-3xl h-12 w-full md:w-fit border border-border/40 shadow-inner inline-flex">
                        <TabsTrigger
                            value="users"
                            className="rounded-2xl px-8 h-full gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
                        >
                            <Users className="h-3.5 w-3.5" /> Users
                        </TabsTrigger>
                        <TabsTrigger
                            value="admins"
                            className="rounded-2xl px-8 h-full gap-2 font-bold text-xs transition-all data-[state=active]:bg-background data-[state=active]:text-destructive data-[state=active]:shadow-sm"
                        >
                            <ShieldAlert className="h-3.5 w-3.5" /> Admins
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="w-full min-w-0 overflow-hidden">
                    <TabsContent value="users" className="mt-0 outline-none">
                        <UserTable
                            users={initialData.data}
                            currentSort={searchParams.sortBy || 'createdAt'}
                            currentOrder={searchParams.sortOrder || 'desc'}
                            selectedIds={selectedIds}
                            onSelectRow={handleSelectRow}
                            onSelectAll={handleSelectAll}
                        />
                    </TabsContent>

                    <TabsContent value="admins" className="mt-0 outline-none">
                        <UserTable
                            users={initialData.data}
                            currentSort={searchParams.sortBy || 'createdAt'}
                            currentOrder={searchParams.sortOrder || 'desc'}
                            selectedIds={selectedIds}
                            onSelectRow={handleSelectRow}
                            onSelectAll={handleSelectAll}
                        />
                    </TabsContent>
                </div>
            </Tabs>

            <div className="pt-4 border-t border-border/40 min-w-0">
                <Pagination currentPage={initialData.meta.page} totalPages={initialData.meta.lastPage} />
            </div>

            <BulkActionsToolbar
                selectedIds={selectedIds}
                onClear={() => setSelectedIds([])}
            />
        </>
    );
}