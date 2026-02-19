import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { UserFilters } from '../../../../components/features/admin/user-filters';
import { UsersPageClient } from './users-page-client';

export const metadata = {
    title: 'User Management',
    description: 'Manage platform identities, roles, and forensic status.',
};

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;
    if (!token) return null;

    const resolvedParams = await searchParams;
    const params = new URLSearchParams();

    // Logic: Map standard searchParams to API query
    if (resolvedParams.page) params.set('page', String(resolvedParams.page));
    if (resolvedParams.limit) params.set('limit', String(resolvedParams.limit));
    if (resolvedParams.search) params.set('search', String(resolvedParams.search));
    if (resolvedParams.role) params.set('role', String(resolvedParams.role));
    if (resolvedParams.accountType) params.set('accountType', String(resolvedParams.accountType));
    if (resolvedParams.status) params.set('status', String(resolvedParams.status));
    if (resolvedParams.sortBy) params.set('sortBy', String(resolvedParams.sortBy));
    if (resolvedParams.sortOrder) params.set('sortOrder', String(resolvedParams.sortOrder));

    // Logic: Handle Tab Context
    const activeTab = String(resolvedParams.tab || 'users');
    if (activeTab === 'admins') {
        params.set('role', 'ADMIN');
    }

    // Server-Side Fetch (Triggers loading.tsx)
    const userResult = await ApiService.admin.getUsers(token, params);

    const initialData = userResult || { data: [], meta: { total: 0, page: 1, lastPage: 1 } };

    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="w-full min-w-0">
                <UserFilters />
            </div>

            <UsersPageClient
                initialData={initialData}
                activeTab={activeTab}
                searchParams={resolvedParams}
            />
        </div>
    );
}