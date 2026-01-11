import { cookies } from 'next/headers';
import { HistoryClient } from '../../../../components/features/history/history-client';

async function getInitialHistory(token: string, searchParams: URLSearchParams) {
  try {
    // Pass server-side searchParams to the API
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet/transactions?${searchParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error();
    return res.json();
  } catch (error) {
    return { data: [], meta: { total: 0, page: 1, lastPage: 1 } };
  }
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cookieStore = cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) return null;

  // SOTA: The server reads the URL params and fetches the exact data the user requested
  const initialData = await getInitialHistory(token, new URLSearchParams(searchParams as any));

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