'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ApiService } from '../../../../services/api';
import { UserFilters } from '../../../../components/features/admin/user-filters';
import { UserTable } from '../../../../components/features/admin/user-table';
import { BulkActionsToolbar } from '../../../../components/features/admin/bulk-actions-toolbar';
import { Pagination } from '../../../../components/features/history/pagination';
import { getCookie } from 'cookies-next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';
import { Users, ShieldAlert } from 'lucide-react';

export default function AdminUsersPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>({ data: [], meta: { total: 0, page: 1, lastPage: 1 } });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const activeTab = searchParams.get('tab') || 'users';

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            const token = getCookie('givar_token') as string;
            const params = new URLSearchParams(searchParams.toString());

            if (activeTab === 'admins') {
                params.set('role', 'ADMIN');
            } else {
                if (!params.has('role') || params.get('role') === 'all') {
                    params.set('role', 'USER');
                }
            }

            if (!params.get('sortBy')) params.set('sortBy', 'createdAt');
            if (!params.get('sortOrder')) params.set('sortOrder', 'desc');

            try {
                const result = await ApiService.admin.getUsers(token, params);
                if (result) setData(result);
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setIsLoading(false);
                setSelectedIds([]);
            }
        };

        fetchUsers();
    }, [searchParams, activeTab]);

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        params.set('page', '1');
        // Clean exclusive context when switching views
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
        setSelectedIds(checked ? data.data.map((u: any) => u.id) : []);
    };

    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header and Filter block */}
            <div className="w-full min-w-0">
                <UserFilters />
            </div>

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
                    <TabsContent value="users" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <UserTable
                            users={data.data}
                            currentSort={searchParams.get('sortBy') || 'createdAt'}
                            currentOrder={(searchParams.get('sortOrder') as any) || 'desc'}
                            selectedIds={selectedIds}
                            onSelectRow={handleSelectRow}
                            onSelectAll={handleSelectAll}
                        />
                    </TabsContent>

                    <TabsContent value="admins" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <UserTable
                            users={data.data}
                            currentSort={searchParams.get('sortBy') || 'createdAt'}
                            currentOrder={(searchParams.get('sortOrder') as any) || 'desc'}
                            selectedIds={selectedIds}
                            onSelectRow={handleSelectRow}
                            onSelectAll={handleSelectAll}
                        />
                    </TabsContent>
                </div>
            </Tabs>

            <div className="pt-4 border-t border-border/40 min-w-0">
                <Pagination currentPage={data.meta.page} totalPages={data.meta.lastPage} />
            </div>

            <BulkActionsToolbar
                selectedIds={selectedIds}
                onClear={() => setSelectedIds([])}
            />
        </div>
    );
}