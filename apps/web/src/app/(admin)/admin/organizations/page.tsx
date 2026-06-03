import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { OrganizationTable } from '../../../../components/features/admin/organization-table';
import { OrganizationFilters } from '../../../../components/features/admin/organization-filters';
import { Pagination } from '../../../../components/features/history/pagination';
import { Suspense } from 'react';

export const metadata = {
    title: 'Organizations',
    description: 'Directory of legal entities & verified project organizers.',
};

export default async function AdminOrganizationsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) return null;

    const resolvedParams = await searchParams;
    const params = new URLSearchParams(resolvedParams as any);

    const result = await ApiService.organizations.getOrganizations(token, params);

    const profiles = result?.data || [];
    const meta = result?.meta || { total: 0, page: 1, lastPage: 1 };

    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Standardized search & title row */}
            <div className="w-full min-w-0">
                <Suspense fallback={<div className="h-10 w-full bg-muted/20 animate-pulse rounded-3xl" />}>
                    <OrganizationFilters />
                </Suspense>
            </div>

            <div className="space-y-6 w-full min-w-0">
                <OrganizationTable profiles={profiles} />

                <div className="pt-4 border-t border-border/40">
                    <Suspense fallback={<div className="h-10 w-full bg-muted/20 animate-pulse rounded-3xl" />}>
                        <Pagination currentPage={meta.page} totalPages={meta.lastPage} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
