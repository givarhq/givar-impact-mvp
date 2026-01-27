import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { formatDate } from '../../../../lib/utils/format';
import { Eye, Clock, AlertCircle, Inbox } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../../../lib/utils/cn';
import { AdminProposalFilters } from '../../../../components/features/admin/admin-proposal-filters';
import { Pagination } from '../../../../components/features/history/pagination';

export default async function AdminProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;

  const resolvedParams = await searchParams;
  const params = new URLSearchParams(resolvedParams as any);

  // Parallel Data Fetching with Server-Side Filtering
  const [proposalResult, categories] = await Promise.all([
    ApiService.admin.getProposals(token, params),
    ApiService.projects.getCategories(token)
  ]);

  const proposals = proposalResult?.data || [];
  const meta = proposalResult?.meta || { page: 1, lastPage: 1 };

  const statusStyles: Record<string, string> = {
    SUBMITTED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    UNDER_REVIEW: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    CHANGES_REQUESTED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="md:hidden">
        <h1 className="text-2xl font-bold text-foreground">Proposal Queue</h1>
      </div>

      <AdminProposalFilters categories={categories || []} />

      <div className="space-y-4">
        {proposals.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-border rounded-[32px] bg-muted/20">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-foreground">No proposals match your criteria</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          proposals.map((p: any) => {
            const config = statusStyles[p.status] || 'bg-muted text-muted-foreground';
            return (
                <div key={p.id} className="group relative rounded-[24px] p-[1px] bg-gradient-to-r from-border/50 to-transparent hover:from-primary/20 transition-all duration-300 shadow-sm hover:shadow-md">
                    <div className="bg-card rounded-[23px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
                        <div className="flex-1 space-y-3 min-w-0 relative z-10">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg border", config)}>
                                    {p.status.replace('_', ' ')}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">ID: {p.id.split('-')[0]}</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">{p.title || 'Untitled Proposal'}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.shortDesc || 'No summary provided'}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[11px] font-medium text-muted-foreground uppercase tracking-tight">
                                <span className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-primary" /> {p.category?.name}</span>
                                <span className="flex items-center gap-1.5"><Inbox className="h-3.5 w-3.5 text-primary" /> {p.user?.firstName} {p.user?.lastName}</span>
                                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> {formatDate(p.submittedAt)}</span>
                            </div>
                        </div>
                        <Link href={`/admin/proposals/${p.id}`} className="shrink-0 relative z-10 w-full md:w-auto">
                            <Button variant="secondary" className="w-full md:w-auto rounded-xl gap-2 font-bold px-6 bg-primary/5 hover:bg-primary hover:text-white border-transparent transition-all group/btn shadow-none hover:shadow-lg hover:shadow-primary/20">
                                Review Details <Eye className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                            </Button>
                        </Link>
                    </div>
                </div>
            )
          })
        )}

        <Pagination currentPage={meta.page} totalPages={meta.lastPage} />
      </div>
    </div>
  );
}