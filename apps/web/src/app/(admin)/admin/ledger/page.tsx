import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { LedgerOversightClient } from '../../../../components/features/admin/ledger-oversight-client';

export const metadata = {
  title: 'Ledger oversight',
  description: 'Forensic financial monitoring and manual reconciliation tools.',
};

export default async function LedgerOversightPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) return null;

  // Parallel fetching of all context needed for financial oversight
  const [suspenseResult, projectResult] = await Promise.all([
    ApiService.admin.getSuspense(token),
    ApiService.projects.list(token, new URLSearchParams({ limit: '100' }))
  ]);

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500">

      <div className="w-full min-w-0">
        <LedgerOversightClient
          initialSuspense={suspenseResult || []}
          activeProjects={projectResult?.data || []}
        />
      </div>
    </div>
  );
}