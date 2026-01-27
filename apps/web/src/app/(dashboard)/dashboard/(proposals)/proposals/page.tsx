import { cookies } from 'next/headers';
import Link from 'next/link';
import { ApiService } from '../../../../../services/api';
import { Button } from '../../../../../components/ui/button';
import { Rocket, Plus } from 'lucide-react';
import { ProposalCard } from '../../../../../components/features/proposals/proposal-card';

export default async function MyProposalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;
  
  const proposals = (await ApiService.proposals.getMyProposals(token)) || [];

  return (
    <div className="space-y-8 min-h-screen pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">My Causes</h1>
          <p className="text-muted-foreground text-xs">Manage your drafts and track proposal status.</p>
        </div>
        <Link href="/dashboard/proposals/start">
          <Button className="h-11 rounded-xl px-6 shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Start a Cause
          </Button>
        </Link>
      </div>

      {/* Grid */}
      {proposals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {proposals.map((p: any) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-3xl bg-card/30">
             <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
                <Rocket className="h-10 w-10 text-primary" />
             </div>
             <h3 className="text-xl font-bold text-foreground">No Causes Yet</h3>
             <p className="text-muted-foreground mt-2 max-w-sm">
                You haven't started any proposals. Launch a cause to begin raising funds for your community.
             </p>
             <Link href="/dashboard/proposals/start" className="mt-8">
                <Button variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                    Start Your First Cause
                </Button>
             </Link>
        </div>
      )}
    </div>
  );
}