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
import Link from 'next/link';

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
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Standardized Header/Filter Row */}
            <UserFilters />

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
                <TabsList className="bg-muted/50 p-1.5 rounded-[22px] h-14 w-full md:w-auto border border-border/40 inline-flex">
                    <TabsTrigger
                        value="users"
                        className="rounded-xl px-8 h-full gap-2.5 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg"
                    >
                        <Users className="h-4 w-4" /> Users
                    </TabsTrigger>
                    <TabsTrigger
                        value="admins"
                        className="rounded-xl px-8 h-full gap-2.5 font-bold text-[11px] uppercase tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:text-destructive data-[state=active]:shadow-lg"
                    >
                        <ShieldAlert className="h-4 w-4" /> Admins
                    </TabsTrigger>
                </TabsList>

                <div className="relative">
                    <TabsContent value="users" className="mt-0 outline-none">
                        <UserTable
                            users={data.data}
                            currentSort={searchParams.get('sortBy') || 'createdAt'}
                            currentOrder={(searchParams.get('sortOrder') as any) || 'desc'}
                            selectedIds={selectedIds}
                            onSelectRow={handleSelectRow}
                            onSelectAll={handleSelectAll}
                        />
                    </TabsContent>

                    <TabsContent value="admins" className="mt-0 outline-none">
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

            <div className="pt-4 border-t border-border/50">
                <Pagination currentPage={data.meta.page} totalPages={data.meta.lastPage} />
            </div>

            <BulkActionsToolbar
                selectedIds={selectedIds}
                onClear={() => setSelectedIds([])}
            />
        </div>
    );
}