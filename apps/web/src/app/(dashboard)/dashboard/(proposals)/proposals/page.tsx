import { cookies } from 'next/headers';
import Link from 'next/link';
import { ApiService } from '../../../../../services/api';
import { Button } from '../../../../../components/ui/button';
import { Rocket, Plus, Inbox } from 'lucide-react';
import { ProposalCard } from '../../../../../components/features/proposals/proposal-card';

export const metadata = {
  title: 'My Causes',
  description: 'Manage your project proposals & track live impact.',
};

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
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-foreground">My Causes</h1>
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

      {proposals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 min-w-0">
          {proposals.map((p: any) => (
            <div key={p.id} className="min-w-0 flex-1 h-full">
              <ProposalCard proposal={p} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5 min-w-0">
          <div className="h-16 w-16 bg-muted/50 rounded-[24px] flex items-center justify-center mb-6 border border-border/40 shadow-inner">
            <Rocket className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <div className="space-y-2 max-w-xs mx-auto">
            <h3 className="text-lg font-bold text-foreground tracking-tight">Your impact starts here</h3>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Launch a project to begin raising funds for verified community impact.
            </p>
          </div>
          <Link href="/dashboard/proposals/start" className="mt-8">
            <Button variant="outline" className="rounded-3xl border-primary/30 text-primary hover:bg-primary/5 font-bold h-11 px-8 transition-all active:scale-95">
              Launch first cause
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}