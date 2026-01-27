import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { formatDate } from '../../../../lib/utils/format';
import { Eye, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../../../lib/utils/cn';

export default async function AdminProposalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;

  const proposals = (await ApiService.admin.getProposals(token)) || [];

  const statusStyles: Record<string, string> = {
    SUBMITTED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    UNDER_REVIEW: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    CHANGES_REQUESTED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <h1 className="text-2xl font-bold text-foreground">Proposal Queue</h1>
      </div>

      <div className="grid gap-4">
        {proposals.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20">
            <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-20" />
            <p className="text-muted-foreground">The queue is currently empty.</p>
          </div>
        ) : (
          proposals.map((p: any) => (
            <div key={p.id} className="group relative rounded-2xl p-[1px] bg-gradient-to-r from-border/50 to-transparent hover:from-primary/20 transition-all duration-300">
              <div className="bg-card rounded-[15px] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-widest", statusStyles[p.status])}>
                       {p.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">{p.id.split('-')[0]}</span>
                  </div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{p.title || 'Untitled Proposal'}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                     <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {p.category?.name}</span>
                     <span>Submitted {formatDate(p.submittedAt)} by {p.user?.firstName}</span>
                  </div>
                </div>

                <Link href={`/admin/proposals/${p.id}`}>
                  <Button variant="secondary" className="rounded-xl gap-2 font-bold group/btn">
                    Review Proposal <Eye className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}