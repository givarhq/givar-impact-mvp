'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowRight, Loader2, ShieldCheck, Briefcase, Clock } from 'lucide-react';
import { BudgetEditor } from '../../../../../../../../components/features/proposals/budget-editor';
import { TimelineEditor } from '../../../../../../../../components/features/proposals/timeline-editor';
import { RichTextEditor } from '../../../../../../../../components/ui/rich-text-editor';
import toast from 'react-hot-toast';

export default function PlanPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;

  const { setProposal, riskAnalysis, budgetBreakdown, executionTimeline, updateField } = useProposalStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentState = useProposalStore.getState();
        // Prevent fetching from API if store already has this proposal's latest state
        if (currentState.id !== proposalId) {
          const proposalData = await ApiService.proposals.get(proposalId);
          setProposal(proposalData);
        }
      } catch (error) {
        toast.error("Draft failed to load");
        router.push('/dashboard/proposals');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [proposalId, setProposal, router]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground min-w-0">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Validation Logic: 
  // 1. Budget items must exist and have stage, amount, and description
  const isBudgetValid = budgetBreakdown.length > 0 && budgetBreakdown.every(
    item => item.stage && item.amount > 0 && item.description?.trim()
  );

  // 2. Auto-generated timeline items must have deliverables defined
  const isTimelineValid = executionTimeline.length > 0 && executionTimeline.every(
    item => item.deliverables?.trim()
  );

  const isPlanValid = isBudgetValid && isTimelineValid;

  return (
    <div className="space-y-6 w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border-border/40 bg-card rounded-3xl overflow-hidden shadow-sm min-w-0">
        <CardHeader className="p-6 md:p-8 border-b border-border/40 bg-muted/10">
          <CardTitle className="text-lg md:text-xl font-bold">Budget & Use of Funds</CardTitle>
          <CardDescription className="text-sm font-medium mt-1.5">
            Outline what is needed to complete this cause and who will receive the funds.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8 pt-8 space-y-12 min-w-0">

          {/* Trust Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3 shadow-sm -mt-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-900/80 leading-relaxed font-medium">
              Funds are paid directly to verified institutions or service providers, not to organisers.
            </p>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="min-w-0">
              <BudgetEditor />
            </div>

            <p className="text-[11px] font-medium text-muted-foreground italic text-center pt-2">
              This cause will be funded one item at a time, based on the stages defined above.
            </p>
          </div>

          <div className="space-y-4 min-w-0 pt-6 border-t border-border/40">
            <div className="px-1 space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Execution Roadmap
              </h3>
              <p className="text-sm text-muted-foreground font-medium">Define the expected deliverables and outcomes for each funding stage.</p>
            </div>
            <div className="min-w-0">
              <TimelineEditor />
            </div>
          </div>

          <div className="space-y-4 min-w-0 pt-6 border-t border-border/40">
            <div className="px-1 space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Additional Notes (Optional)
              </h3>
              <p className="text-sm text-muted-foreground font-medium">Identify potential roadblocks, mitigation protocols, or extra details.</p>
            </div>
            <RichTextEditor
              placeholder="e.g. Potential weather delays, vendor availability, logistical bottlenecks..."
              content={riskAnalysis || ''}
              onChange={(content) => updateField('riskAnalysis', content)}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 min-w-0 gap-4">
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-3xl h-12 px-6 text-xs font-bold border-border/60 text-muted-foreground hover:bg-muted transition-all active:scale-95 min-w-0"
              onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/media`)}
            >
              <span>Back</span>
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {!isPlanValid && (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 text-center">
                  Fill all required expense & deliverable fields to continue
                </span>
              )}
              <Button
                disabled={!isPlanValid}
                className="w-full sm:w-auto h-12 rounded-3xl px-10 font-bold text-sm shadow-lg shadow-primary/20 gap-2 active:scale-[0.98] transition-all border-0 min-w-0 bg-primary text-white hover:bg-primary/90"
                onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/trust`)}
              >
                <span>Verification</span> <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}