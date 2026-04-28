import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { VerificationTabs } from '../../../../components/features/admin/verification-tabs';
import { Pagination } from '../../../../components/features/history/pagination';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Verifications',
    description: 'Identity & KYC verifications queue.',
};

export default async function AdminVerificationPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;
    if (!token) return null;

    const orgsResult = await ApiService.organizations.getPending(token);

    const emptyData = { data: [], meta: { total: 0, page: 1, lastPage: 1 } };

    const orgsData = orgsResult
        ? (Array.isArray(orgsResult) ? { data: orgsResult, meta: { total: orgsResult.length, page: 1, lastPage: 1 } } : orgsResult)
        : emptyData;

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
            <VerificationTabs orgs={orgsData} />

            <div className="pt-4 border-t border-border/40">
                <Pagination currentPage={Number(orgsData.meta.page)} totalPages={Number(orgsData.meta.lastPage)} />
            </div>
        </div>
    );
}