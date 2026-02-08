import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { OrganizationTable } from '../../../../components/features/admin/organization-table';
import { OrganizationFilters } from '../../../../components/features/admin/organization-filters';
import { Pagination } from '../../../../components/features/history/pagination';

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
        <div className="space-y-8 pb-10 animate-in fade-in duration-500">
            {/* Standardized Header/Filter Row */}
            <OrganizationFilters />

            <div className="space-y-6">
                <OrganizationTable profiles={profiles} />

                <div className="pt-2">
                    <Pagination currentPage={meta.page} totalPages={meta.lastPage} />
                </div>
            </div>
        </div>
    );
}