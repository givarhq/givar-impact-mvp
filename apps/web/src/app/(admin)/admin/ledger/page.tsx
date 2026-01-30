import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { LedgerOversightClient } from '../../../../components/features/admin/ledger-oversight-client';

export default async function LedgerOversightPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) return null;

  // Parallel fetching of all context needed for financial oversight
  const [suspenseResult, projectResult] = await Promise.all([
    ApiService.admin.getSuspense(token),
    ApiService.projects.list(token, new URLSearchParams({ limit: '100' })) // For allocation dropdown
  ]);

  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <h1 className="text-2xl font-bold text-foreground">Ledger Oversight</h1>
      </div>
      
      <LedgerOversightClient 
        initialSuspense={suspenseResult || []} 
        activeProjects={projectResult?.data || []}
      />
    </div>
  );
}