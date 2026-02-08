'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ApiService } from '../../../../services/api';
import { UserFilters } from '../../../../components/features/admin/user-filters';
import { UserTable } from '../../../../components/features/admin/user-table';
import { BulkActionsToolbar } from '../../../../components/features/admin/bulk-actions-toolbar';
import { Pagination } from '../../../../components/features/history/pagination';
import { TrendingUp, ShieldAlert, Users } from 'lucide-react';
import { getCookie } from 'cookies-next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';

export default function AdminUsersPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>({ data: [], meta: { total: 0, page: 1, lastPage: 1 } });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Tab logic: defaults to 'users'
    const activeTab = searchParams.get('tab') || 'users';

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            const token = getCookie('givar_token') as string;
            const params = new URLSearchParams(searchParams.toString());

            // Enforce Tab Context for Roles
            if (activeTab === 'admins') {
                params.set('role', 'ADMIN');
            } else {
                // For the 'users' tab, default to USER role if no specific role filter is applied
                // This keeps the lists distinct unless the admin explicitly filters for 'all' in the filter bar
                if (!params.has('role') || params.get('role') === 'all') {
                    params.set('role', 'USER');
                }
            }

            // Default Sorting
            if (!params.get('sortBy')) params.set('sortBy', 'createdAt');
            if (!params.get('sortOrder')) params.set('sortOrder', 'desc');

            try {
                const result = await ApiService.admin.getUsers(token, params);
                if (result) setData(result);
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setIsLoading(false);
                // Clear selections on re-fetch/tab change to prevent accidental bulk actions on wrong entities
                setSelectedIds([]);
            }
        };

        fetchUsers();
    }, [searchParams, activeTab]);

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        params.set('page', '1');

        // Reset specific filters when switching tabs to avoid confusion (e.g. searching for a User in Admin tab)
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
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black tracking-tight text-foreground md:hidden">User Management</h1>
                    <p className="text-sm text-muted-foreground font-medium">Monitor account health, impact value, and forensic logs.</p>
                </div>
                <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-2xl border border-border/50 shadow-sm">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">{data.meta.total} Entities Found</span>
                </div>
            </div>

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

                {/* Shared Filter Bar */}
                <UserFilters />

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