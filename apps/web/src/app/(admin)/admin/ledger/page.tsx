import { cookies } from 'next/headers';
import { LedgerOversightClient } from '../../../../components/features/admin/ledger-oversight-client';

export const metadata = {
  title: 'Ledger Oversight',
  description: 'Financial monitoring & manual reconciliation tools.',
};

export default async function LedgerOversightPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) return null;

  return (
    <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="w-full min-w-0">
        <LedgerOversightClient />
      </div>
    </div>
  );
}