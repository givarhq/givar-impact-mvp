import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { AuditTable } from '../../../../components/features/admin/audit-table';
import { AuditSummary } from '../../../../components/features/admin/audit-summary';
import { AuditFilters } from '../../../../components/features/admin/audit-filters';
import { Pagination } from '../../../../components/features/history/pagination';

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

  const [logsResult, summaryStats] = await Promise.all([
    ApiService.admin.getAuditLogs(token, params),
    ApiService.admin.getAuditSummary(token)
  ]);

  const logs = logsResult?.data || [];
  const meta = logsResult?.meta || { page: 1, lastPage: 1 };

  return (
    <div className="space-y-8">
      {/* 1. Standardized Header row with Search */}
      <AuditFilters />

      {/* 2. Summary Cards */}
      {summaryStats && <AuditSummary stats={summaryStats} />}

      {/* 3. Data Table */}
      <div className="space-y-4">
        <AuditTable logs={logs} />

        {/* 4. Pagination */}
        <Pagination currentPage={meta.page} totalPages={meta.lastPage} />
      </div>
    </div>
  );
}