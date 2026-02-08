import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { VerificationTabs } from '../../../../components/features/admin/verification-tabs';
import { Pagination } from '../../../../components/features/history/pagination';
import { EvidenceFilters } from '../../../../components/features/admin/evidence-filters';

export const dynamic = 'force-dynamic';

export default async function AdminVerificationPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; search?: string; status?: string; tab?: string }>;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;
    if (!token) return null;

    const resolvedParams = await searchParams;
    const params = new URLSearchParams();
    params.set('page', resolvedParams.page || '1');
    params.set('limit', '15');
    if (resolvedParams.search) params.set('search', resolvedParams.search);
    if (resolvedParams.status) params.set('status', resolvedParams.status);

    const [orgsResult, evidenceResult] = await Promise.all([
        ApiService.organizations.getPending(token),
        ApiService.admin.getPendingEvidence(token, params)
    ]);

    const emptyData = { data: [], meta: { total: 0, page: 1, lastPage: 1 } };

    const orgsData = orgsResult
        ? (Array.isArray(orgsResult) ? { data: orgsResult, meta: { total: orgsResult.length, page: 1, lastPage: 1 } } : orgsResult)
        : emptyData;

    const evidenceData = evidenceResult ?? emptyData;

    const activeTab = resolvedParams.tab || 'evidence';
    const activeMeta = activeTab === 'evidence' ? evidenceData.meta : orgsData.meta;

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header row with search and title */}
            <EvidenceFilters />

            {/* Content Tabs */}
            <VerificationTabs orgs={orgsData} evidence={evidenceData} />

            <div className="pt-4 border-t border-border/50">
                <Pagination currentPage={Number(activeMeta.page)} totalPages={Number(activeMeta.lastPage)} />
            </div>
        </div>
    );
}