'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowLeft, ArrowRight, ClipboardList, Loader2, ShieldCheck, Target } from 'lucide-react';
import { BudgetEditor } from '../../../../../../../../components/features/proposals/budget-editor';
import { TimelineEditor } from '../../../../../../../../components/features/proposals/timeline-editor';
import { Textarea } from '../../../../../../../../components/ui/textarea';
import toast from 'react-hot-toast';

export default function PlanPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;

  const { setProposal, riskAnalysis, updateField } = useProposalStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ApiService.proposals.get(proposalId)
      .then(data => {
        setProposal(data);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("Draft failed to load");
        router.push('/dashboard/proposals');
      });
  }, [proposalId, setProposal, router]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground min-w-0">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">

      <Card className="border-border/40 bg-card rounded-[32px] overflow-hidden shadow-sm min-w-0">
        <CardHeader className="p-6 md:p-8 border-b border-border/40 bg-muted/10">
          <div className="flex items-center gap-2 text-primary mb-1 min-w-0">
            <ClipboardList className="h-4 w-4 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Strategy</span>
          </div>
          <CardTitle className="text-lg md:text-xl font-bold">Plan your execution</CardTitle>
          <CardDescription className="text-xs font-medium">
            Define your ledger and roadmap. Precision here is critical for administrative audit approval.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8 pt-8 space-y-12 min-w-0">
          {/* Budget Section */}
          <div className="space-y-4 min-w-0">
            <div className="px-1 space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Budget ledger
              </h3>
              <p className="text-xs text-muted-foreground font-medium">Itemize every requirement for the project procurement.</p>
            </div>
            <div className="min-w-0">
              <BudgetEditor />
            </div>
          </div>

          {/* Timeline Section */}
          <div className="space-y-4 min-w-0 pt-6 border-t border-border/40">
            <div className="px-1 space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Implementation roadmap
              </h3>
              <p className="text-xs text-muted-foreground font-medium">Define key phases and verifiable deliverables.</p>
            </div>
            <div className="min-w-0">
              <TimelineEditor />
            </div>
          </div>

          {/* Risks Section */}
          <div className="space-y-4 min-w-0 pt-6 border-t border-border/40">
            <div className="px-1 space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Risk assessment
              </h3>
              <p className="text-xs text-muted-foreground font-medium">Identify potential roadblocks and mitigation protocols.</p>
            </div>
            <Textarea
              placeholder="e.g. Potential weather delays, vendor availability, logistical bottlenecks..."
              value={riskAnalysis || ''}
              onChange={(e) => updateField('riskAnalysis', e.target.value)}
              className="min-h-[120px] rounded-2xl bg-muted/20 border-border/60 focus:bg-background transition-all font-medium text-xs"
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-border/40 min-w-0 gap-4">
            <Button
              variant="outline"
              className="rounded-3xl h-12 px-6 text-xs font-bold border-border/60 text-muted-foreground hover:bg-muted transition-all active:scale-95"
              onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/media`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              className="h-12 rounded-3xl px-10 font-bold text-sm tracking-widest shadow-lg shadow-primary/20 gap-2 active:scale-[0.98] transition-all border-0"
              onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/trust`)}
            >
              Next: Verification <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}