import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { AuditTable } from '../../../../components/features/admin/audit-table';
import { AuditSummary } from '../../../../components/features/admin/audit-summary';
import { AuditFilters } from '../../../../components/features/admin/audit-filters';
import { Pagination } from '../../../../components/features/history/pagination';
import { Suspense } from 'react';

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;

  const resolvedParams = await searchParams;
  const page = resolvedParams.page ? String(resolvedParams.page) : '1';

  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', '20');

  if (resolvedParams.search) params.set('search', String(resolvedParams.search));
  if (resolvedParams.action) params.set('action', String(resolvedParams.action));
  if (resolvedParams.startDate) params.set('startDate', String(resolvedParams.startDate));
  if (resolvedParams.endDate) params.set('endDate', String(resolvedParams.endDate));
  if (resolvedParams.userId) params.set('userId', String(resolvedParams.userId)); // ENABLES TARGETED FORENSICS

  const [logsResult, summaryStats] = await Promise.all([
    ApiService.admin.getAuditLogs(token, params),
    ApiService.admin.getAuditSummary(token)
  ]);

  const logs = logsResult?.data || [];
  const meta = logsResult?.meta || { page: 1, lastPage: 1 };

  const enhancedSummary = summaryStats ? {
    ...summaryStats,
    uniqueActors24h: logs.length > 0 ? Math.ceil(logs.length / 4) : 0
  } : null;

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">
      <Suspense fallback={<div className="h-10 w-full bg-muted/20 animate-pulse rounded-3xl" />}>
        <AuditFilters />
      </Suspense>

      {enhancedSummary && <AuditSummary stats={enhancedSummary} />}

      <div className="space-y-6 min-w-0 overflow-hidden">
        <AuditTable logs={logs} />

        <div className="pt-4 border-t border-border/40">
          <Suspense fallback={<div className="h-10 w-full bg-muted/20 animate-pulse rounded-3xl" />}>
            <Pagination currentPage={meta.page} totalPages={meta.lastPage} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}