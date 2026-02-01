import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Inbox, ShieldCheck } from 'lucide-react';
import { EvidenceQueueTable } from '../../../../components/features/admin/evidence-queue-table';
import { EvidenceFilters } from '../../../../components/features/admin/evidence-filters';
import { Pagination } from '../../../../components/features/history/pagination';

export const dynamic = 'force-dynamic';

export default async function AdminEvidencePage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;
    if (!token) return null;

    const resolvedParams = await searchParams;

    const params = new URLSearchParams();
    params.set('page', resolvedParams.page || '1');
    params.set('limit', '15');

    if (resolvedParams.search) params.set('search', resolvedParams.search);

    if (resolvedParams.status) {
        params.set('status', resolvedParams.status);
    }

    const result = await ApiService.admin.getPendingEvidence(token, params);
    const proofs = result?.data || [];
    const meta = result?.meta || { total: 0, page: 1, lastPage: 1 };

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* ... rest of the JSX components (Header, Filters, Table, Pagination) ... */}
            <div className="md:hidden flex flex-col gap-1 mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Evidence Audit</h1>
            </div>

            <div className="bg-primary/[0.03] border border-primary/20 p-5 rounded-[24px] flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Verification Protocol</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                        Verify on-ground impact through visual assets and narratives. Approval is an immutable record of success.
                    </p>
                </div>
                <div className="ml-auto hidden sm:block">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 rounded-lg h-6 font-bold">
                        {meta.total} Records Found
                    </Badge>
                </div>
            </div>

            <EvidenceFilters />

            {proofs.length === 0 ? (
                <Card className="border-dashed border-2 border-border/60 bg-muted/5 py-24 flex flex-col items-center justify-center text-center rounded-[32px]">
                    <Inbox className="h-12 w-12 text-muted-foreground opacity-10 mb-4" />
                    <h3 className="text-lg font-bold text-foreground opacity-60 uppercase tracking-widest">No matching records</h3>
                    <p className="text-xs text-muted-foreground mt-1">Try broadening your search or switching filters.</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    <EvidenceQueueTable proofs={proofs} />
                    <Pagination currentPage={meta.page} totalPages={meta.lastPage} />
                </div>
            )}
        </div>
    );
}