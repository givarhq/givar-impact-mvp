import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ApiService } from '../../../../../services/api';
import { ProposalReview } from '../../../../../components/features/admin/proposal-review';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../../../components/ui/button';

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
        console.error(`[AdminProposalDetail] Proposal not found: ${id}`);
        notFound();
    }

    return (
      <div className="space-y-6">
        <Link href="/admin/proposals">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground pl-0">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Queue
            </Button>
        </Link>
        
        <ProposalReview proposal={proposal} />
      </div>
    );
  } catch (error) {
    console.error("[AdminProposalDetail] Data fetch error:", error);
    notFound();
  }
}