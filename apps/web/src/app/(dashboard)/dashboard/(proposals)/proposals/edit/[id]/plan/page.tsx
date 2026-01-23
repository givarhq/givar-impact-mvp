'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BudgetEditor } from '../../../../../../../../components/features/proposals/budget-editor';
import { TimelineEditor } from '../../../../../../../../components/features/proposals/timeline-editor';

export default function PlanPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  
  const { setProposal } = useProposalStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ApiService.proposals.get(proposalId)
      .then(data => {
        setProposal(data);
        setIsLoading(false);
      })
      .catch(() => router.push('/dashboard'));
  }, [proposalId, setProposal, router]);

  if (isLoading) return <div>Loading Draft...</div>;

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">The Plan</CardTitle>
        <CardDescription>
          Break down your budget and timeline. This is critical for transparency and admin approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-12">
        {/* Budget Section */}
        <div className="space-y-4">
            <h3 className="font-semibold">Budget Breakdown</h3>
            <p className="text-sm text-muted-foreground">List every item or service Givar will be paying for.</p>
            <BudgetEditor />
        </div>
        
        {/* Timeline Section */}
        <div className="space-y-4">
            <h3 className="font-semibold">Execution Timeline</h3>
            <p className="text-sm text-muted-foreground">Define the key phases and deliverables for your project.</p>
            <TimelineEditor />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-8 border-t">
            <Button variant="outline" className="rounded-xl" onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/media`)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button size="lg" className="h-12 rounded-xl" onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/trust`)}>
                Next: The Trust <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}