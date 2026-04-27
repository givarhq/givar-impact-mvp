import { cookies } from 'next/headers';
import Link from 'next/link';
import { ApiService } from '../../../../../services/api';
import { Button } from '../../../../../components/ui/button';
import { Plus } from 'lucide-react';
import { MyProposalsClient } from '../../../../../components/features/proposals/my-proposals-client';

export const metadata = {
  title: 'My Causes',
  description: 'Manage your project proposals & track live impact.',
};

export const dynamic = 'force-dynamic';

export default async function MyProposalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;

  const proposals = (await ApiService.proposals.getMyProposals(token)) || [];

  return (
    <div className="space-y-4 md:space-y-6 w-full min-w-0 animate-in fade-in duration-500">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4 min-w-0 px-1">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-foreground">My Causes</h1>
          <p className="hidden md:block text-sm text-muted-foreground font-medium mt-1">
            Manage project proposals & track live platform impact.
          </p>
        </div>

        <Link href="/dashboard/proposals/start" className="shrink-0">
          <Button className="h-10 md:h-12 rounded-3xl px-5 md:px-8 shadow-lg shadow-primary/20 font-bold bg-primary text-white border-0 active:scale-95 transition-all text-xs md:text-sm">
            <Plus className="mr-1.5 h-4 w-4" /> New
          </Button>
        </Link>
      </div>

      <MyProposalsClient proposals={proposals} />
    </div>
  );
}