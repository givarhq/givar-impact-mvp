import { cookies } from 'next/headers';
import { HistoryClient } from '../../../../components/features/history/history-client';
import { ApiService } from '../../../../services/api';

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) return null;

  // 1. Await params
  const resolvedParams = await searchParams;
  
  const response = await ApiService.wallet.getTransactions(
    token, 
    new URLSearchParams(resolvedParams as any)
  );

  // 3. Robust Fallback
  const initialData = response || { 
    data: [], 
    meta: { total: 0, page: 1, lastPage: 1 } 
  };

  return (
    <div className="space-y-6">
      {/* Mobile Title */}
      <div className="md:hidden">
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground">
          Review your complete transaction log.
        </p>
      </div>

      <HistoryClient initialData={initialData} />
    </div>
  );
}