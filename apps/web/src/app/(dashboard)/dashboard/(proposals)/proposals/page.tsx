import { cookies } from 'next/headers';
import Link from 'next/link';
import { ApiService } from '../../../../../services/api';
import { Card } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import { FileText, PlusCircle, Check, Clock, X, MessageSquare } from 'lucide-react';

export default async function MyProposalsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;
  
  const proposals = (await ApiService.proposals.getMyProposals(token)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Causes</h1>
          <p className="text-muted-foreground text-sm">Track your drafts and submitted project proposals.</p>
        </div>
        <Link href="/dashboard/proposals/start">
          <Button className="rounded-xl">
            <PlusCircle className="mr-2 h-4 w-4" /> New Proposal
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {proposals.length > 0 ? (
          proposals.map(p => <ProposalListItem key={p.id} proposal={p} />)
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-xl">
             <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
             <p>You haven't started any proposals yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline component for list item
function ProposalListItem({ proposal }: { proposal: any }) {
    const statusMap = {
        DRAFT: { text: "Draft", icon: Clock, color: "bg-amber-500/10 text-amber-600" },
        SUBMITTED: { text: "Submitted", icon: Check, color: "bg-blue-500/10 text-blue-500" },
        REJECTED: { text: "Rejected", icon: X, color: "bg-destructive/10 text-destructive" },
        CHANGES_REQUESTED: { text: "Changes Requested", icon: MessageSquare, color: "bg-purple-500/10 text-purple-500" },
    };
    const statusInfo = statusMap[proposal.status as keyof typeof statusMap] || statusMap.DRAFT;

    return (
        <Link href={`/dashboard/proposals/edit/${proposal.id}/media`}>
            <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div>
                    <h3 className="font-semibold">{proposal.title || "Untitled Draft"}</h3>
                    <p className="text-xs text-muted-foreground">{proposal.category?.name}</p>
                </div>
                <Badge className={`gap-2 ${statusInfo.color}`}>
                    <statusInfo.icon className="h-3 w-3" />
                    {statusInfo.text}
                </Badge>
            </Card>
        </Link>
    )
}