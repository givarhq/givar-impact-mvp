'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ApiService } from '../../../../services/api';
import { UserFilters } from '../../../../components/features/admin/user-filters';
import { UserTable } from '../../../../components/features/admin/user-table';
import { BulkActionsToolbar } from '../../../../components/features/admin/bulk-actions-toolbar';
import { Pagination } from '../../../../components/features/history/pagination';
import { TrendingUp, Loader2 } from 'lucide-react';
import { getCookie } from 'cookies-next';

export default function AdminUsersPage() {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>({ data: [], meta: { total: 0, page: 1, lastPage: 1 } });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            const token = getCookie('givar_token') as string;
            const params = new URLSearchParams(searchParams.toString());

            if (!params.get('sortBy')) params.set('sortBy', 'createdAt');
            if (!params.get('sortOrder')) params.set('sortOrder', 'desc');

            const result = await ApiService.admin.getUsers(token, params);
            if (result) setData(result);
            setIsLoading(false);
            setSelectedIds([]);
        };
        fetchUsers();
    }, [searchParams]);

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
                    <span className="text-xs font-bold text-foreground">{data.meta.total} Total Entities</span>
                </div>
            </div>

            <UserFilters />

            <div className="relative">
                <UserTable
                    users={data.data}
                    currentSort={searchParams.get('sortBy') || 'createdAt'}
                    currentOrder={(searchParams.get('sortOrder') as any) || 'desc'}
                    selectedIds={selectedIds}
                    onSelectRow={handleSelectRow}
                    onSelectAll={handleSelectAll}
                />
            </div>

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