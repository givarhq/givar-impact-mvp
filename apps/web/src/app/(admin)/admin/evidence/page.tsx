import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Inbox, ShieldCheck } from 'lucide-react';
import EvidenceReviewItem from '../../../../components/features/admin/evidence-review-item';

export const dynamic = 'force-dynamic';

export default async function AdminEvidencePage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;
    if (!token) return null;

    const pendingEvidence = await ApiService.admin.getPendingEvidence(token);

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header - Desktop Hidden */}
            <div className="md:hidden flex flex-col gap-1 mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Evidence Audit</h1>
                <p className="text-sm text-muted-foreground">Verify proof of impact from project owners.</p>
            </div>

            {/* Stats/Notice Bar */}
            <div className="bg-primary/[0.03] border border-primary/20 p-5 rounded-[24px] flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Verification Protocol</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                        Inspect visual proof and narratives thoroughly. Approving a proof-of-work entry will automatically notify all project donors and trigger the public impact timeline update.
                    </p>
                </div>
                <div className="ml-auto hidden sm:block">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 rounded-lg h-6">
                        {pendingEvidence?.length || 0} Pending
                    </Badge>
                </div>
            </div>

            {/* The Queue */}
            <div className="grid gap-6">
                {(!pendingEvidence || pendingEvidence.length === 0) ? (
                    <Card className="border-dashed border-2 border-border/60 bg-muted/5 py-24 flex flex-col items-center justify-center text-center rounded-[32px]">
                        <Inbox className="h-12 w-12 text-muted-foreground opacity-10 mb-4" />
                        <h3 className="text-lg font-bold text-foreground opacity-60 uppercase tracking-widest">Audit Queue Empty</h3>
                        <p className="text-xs text-muted-foreground mt-1">No new impact evidence has been submitted for review.</p>
                    </Card>
                ) : (
                    pendingEvidence.map((proof: any) => (
                        <EvidenceReviewItem key={proof.id} proof={proof} />
                    ))
                )}
            </div>
        </div>
    );
}