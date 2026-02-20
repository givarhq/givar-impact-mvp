import { cookies } from 'next/headers';
import { HistoryClient } from '../../../../components/features/history/history-client';
import { ApiService } from '../../../../services/api';

export const metadata = {
  title: 'Transaction History',
  description: 'View your complete impact ledger, download receipts, & track capital flow.',
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;

  const resolvedParams = await searchParams;

  const response = await ApiService.wallet.getTransactions(
    token,
    new URLSearchParams(resolvedParams as any)
  );

  const initialData = response || {
    data: [],
    meta: { total: 0, page: 1, lastPage: 1 }
  };

  return (
    <div className="w-full min-w-0 space-y-4 md:space-y-6">
      <div className="w-full min-w-0">
        <HistoryClient initialData={initialData} />
      </div>
    </div>
  );
}