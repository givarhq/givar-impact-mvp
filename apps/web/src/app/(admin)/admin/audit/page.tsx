import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { AuditTable } from '../../../../components/features/admin/audit-table';

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;

  const resolvedParams = await searchParams;
  const page = resolvedParams?.page ? resolvedParams.page : '1';
  
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', '20');

  // Fetch logs
  const result = await ApiService.admin.getAuditLogs(token, params);
  const logs = result?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between md:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Audit Log</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl text-sm text-blue-400">
            <strong>Security Notice:</strong> This log is immutable. It tracks all authentication attempts, financial movements, and administrative actions.
        </div>
        
        <AuditTable logs={logs} />
        
        {/* Pagination placeholder (reuses logic from History page later if needed) */}
        <div className="flex justify-center pt-4">
            <span className="text-xs text-muted-foreground">Page {page} of {result?.meta?.lastPage || 1}</span>
        </div>
      </div>
    </div>
  );
}