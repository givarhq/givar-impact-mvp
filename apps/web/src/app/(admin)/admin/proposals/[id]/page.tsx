import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ApiService } from '../../../../../services/api';
import { ProposalReview } from '../../../../../components/features/admin/proposal-review';
import { ArrowLeft, Fingerprint } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../../../components/ui/button';

export const metadata = {
  title: 'Review proposal',
  description: 'Technical and legal vetting of project proposals before platform launch.',
};

export default async function AdminProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) {
    redirect('/login?reason=session_expired');
  }

  try {
    const proposal = await ApiService.admin.getProposalDetail(token, id);

    if (!proposal) {
      notFound();
    }

    return (
      <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">

        {/* Header and Breadcrumbs */}
        <div className="flex flex-col gap-4 px-1 min-w-0">
          <Link href="/admin/projects?tab=proposals" className="w-fit">
            <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-3xl">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to queue
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold tracking-tight text-foreground md:hidden truncate">Review proposal</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-3xl bg-muted border border-border/40 text-[11px] font-mono text-muted-foreground shrink-0">
                  <Fingerprint className="h-3 w-3" />
                  {id}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full min-w-0">
          <ProposalReview proposal={proposal} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("[AdminProposalDetail] fetch error:", error);
    notFound();
  }
}