import { cookies } from 'next/headers';
import Link from 'next/link';
import { ApiService } from '../../../../../services/api';
import { Button } from '../../../../../components/ui/button';
import { Rocket, Plus, Inbox } from 'lucide-react';
import { ProposalCard } from '../../../../../components/features/proposals/proposal-card';

export default async function MyProposalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;

  const proposals = (await ApiService.proposals.getMyProposals(token)) || [];

  return (
    <div className="space-y-8 min-h-screen pb-20">

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-lg font-extrabold tracking-tight text-foreground">My Causes</h1>
          <p className="text-muted-foreground text-sm font-medium">Manage your project proposals and track live impact.</p>
        </div>

        <Link href="/dashboard/proposals/start" className="shrink-0">
          <Button className="h-12 rounded-xl px-8 shadow-xl shadow-primary/25 font-bold bg-primary hover:bg-primary/90 text-white transition-all active:scale-95 border-0">
            <Plus className="mr-2 h-5 w-5" /> Start a New Cause
          </Button>
        </Link>
      </div>

      {/* Grid: 3 columns look best for these high-density cards */}
      {proposals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
          {proposals.map((p: any) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      ) : (
        /* SOTA Empty State */
        <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-border/60 rounded-[40px] bg-card/30 backdrop-blur-sm">
          <div className="h-24 w-24 bg-primary/5 rounded-[32px] flex items-center justify-center mb-8 ring-8 ring-primary/[0.02]">
            <Rocket className="h-12 w-12 text-primary opacity-80" />
          </div>
          <h3 className="text-2xl font-bold text-foreground tracking-tight">Your impact starts here</h3>
          <p className="text-muted-foreground mt-3 max-w-sm mx-auto text-sm leading-relaxed">
            You haven&apos;t proposed any causes yet. Launch a project to begin raising funds for verified community impact.
          </p>
          <Link href="/dashboard/proposals/start" className="mt-10">
            <Button variant="outline" className="rounded-xl border-primary/30 text-primary hover:bg-primary/5 font-bold h-12 px-8 transition-all">
              Launch Your First Cause
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}