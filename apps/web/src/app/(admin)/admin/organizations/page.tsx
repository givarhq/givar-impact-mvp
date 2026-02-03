import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { OrganizationTable } from '../../../../components/features/admin/organization-table';
import { OrganizationFilters } from '../../../../components/features/admin/organization-filters';
import { Pagination } from '../../../../components/features/history/pagination';
import { Building2, ShieldCheck } from 'lucide-react';

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
            {/* Page Title - Mobile Only */}
            <div className="md:hidden flex flex-col gap-1 mb-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Organization Directory</h1>
                <p className="text-sm text-muted-foreground">Manage and audit registered legal entities.</p>
            </div>

            <div className="bg-primary/5 border border-primary/20 p-6 rounded-[28px] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Entity Discovery Engine</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                            Search and filter through all organizations. Access detailed KYC documents and historical project data for every registered giver.
                        </p>
                    </div>
                </div>
                <div className="shrink-0 flex items-center gap-2 bg-background/50 px-4 py-2 rounded-2xl border border-border/50">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">{meta.total} Total Entities</span>
                </div>
            </div>

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