import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ApiService } from '../../../../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    ShieldCheck,
    Megaphone,
    Users,
    BadgeCheck,
    Building2,
    UserCheck,
    FileText,
    Activity,
    History,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '../../../../../../lib/utils/cn';
import { formatCurrency, formatDate } from '../../../../../../lib/utils/format';
import { FeedbackThread } from '../../../../../../components/features/communication/feedback-thread';
import { ProjectUpdate } from '../../../../../../types';

export const metadata = {
    title: 'Project Console',
    description: 'Monitor project execution and verified impact records.',
};

export default async function ProjectManagePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;
    if (!token) redirect('/login');

    const project = await ApiService.projects.getOwnerView(id, token);
    if (!project) notFound();

    // Fetch recent donations for the sidebar card
    const ledgerParams = new URLSearchParams({ limit: '4', type: 'INFLOW' });
    const recentDonations = await ApiService.projects.getLedger(ledgerParams, project.slug, token).catch(() => ({ data: [] }));

    const timeline = Array.isArray(project.executionTimeline) ? project.executionTimeline : [];
    const rawBudget = Array.isArray(project.budgetBreakdown) ? project.budgetBreakdown : [];

    // Sort budget items by stage chronologically to ensure accurate progress tracking
    const STAGE_ORDER = ['Early Stage', 'Main Stage', 'Final Stage'];
    const budget = [...rawBudget].sort((a, b) => {
        const idxA = STAGE_ORDER.indexOf(a.stage || 'Main Stage');
        const idxB = STAGE_ORDER.indexOf(b.stage || 'Main Stage');
        return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });

    const vendors = Array.isArray(project.vendors) ? project.vendors : [];
    const updates: ProjectUpdate[] = Array.isArray(project.updates) ? project.updates : [];

    const currentPhaseIndex = project.currentPhaseIndex || 0;
    const isFullyCompleted = timeline.every((m: any) => m.status === 'COMPLETED');

    const isMedical = project.category?.name?.toLowerCase() === 'medical';
    const completedText = isMedical ? 'Treatment Completed' : 'Impact Achieved';

    const finalReport = updates.find((u: ProjectUpdate) => u.type === 'IMPACT_ACHIEVED');
    const otherUpdates = updates.filter((u: ProjectUpdate) => u.type !== 'IMPACT_ACHIEVED');

    const raised = Number(project.raisedAmount || 0);
    const target = Number(project.targetAmount || 0);
    const isFundedState = project.status === 'FUNDED' || (raised >= target && target > 0 && !isFullyCompleted);

    // --- AGGREGATED PHASE FINANCIAL MATH ---
    let previousPhasesMajor = 0;
    let currentPhaseMajor = 0;

    const previousStages = timeline.slice(0, currentPhaseIndex).map((t: any) => t.phase);
    const currentStageName = timeline[currentPhaseIndex]?.phase || 'Main Stage';

    budget.forEach((item: any) => {
        const amt = item.amount || (item as any).cost || 0;
        const itemStage = item.stage || 'Main Stage';

        if (previousStages.includes(itemStage)) {
            previousPhasesMajor += amt;
        } else if (itemStage === currentStageName) {
            currentPhaseMajor += amt;
        }
    });

    const previousPhasesMinor = BigInt(Math.round(previousPhasesMajor * 100));
    let phaseCapMinor = BigInt(Math.round((previousPhasesMajor + currentPhaseMajor) * 100));

    if (timeline.length === 0 || currentPhaseIndex >= timeline.length) {
        phaseCapMinor = BigInt(project.targetAmount || '0');
    }

    const currentPhaseTargetMinor = phaseCapMinor - previousPhasesMinor;
    let raisedInCurrentPhase = BigInt(project.raisedAmount || '0') - previousPhasesMinor;
    if (raisedInCurrentPhase < 0n) raisedInCurrentPhase = 0n;

    const remainingForPhaseMinor = currentPhaseTargetMinor > raisedInCurrentPhase ? currentPhaseTargetMinor - raisedInCurrentPhase : 0n;
    const isPhaseFull = remainingForPhaseMinor < 10000n && currentPhaseTargetMinor > 0n && !isFundedState && !isFullyCompleted;

    const isSystem = project.user?.role === 'ADMIN' || project.user?.role === 'SUPERADMIN';
    let verLabel = 'Advocate';
    let VerIcon = UserCheck;
    let orgName = 'Individual Donor';

    if (isSystem) {
        verLabel = 'Platform';
        VerIcon = BadgeCheck;
        orgName = 'Givar';
    } else if (project.user?.organization?.kycType === 'ORGANIZATION') {
        verLabel = 'Organization';
        VerIcon = Building2;
        orgName = project.user.organization.legalName;
    } else if (project.user?.organization?.status === 'VERIFIED') {
        orgName = project.user.organization.legalName;
    }

    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-24">

            <div className="flex flex-col gap-4 px-1 min-w-0">
                <Link href="/dashboard/proposals" className="w-fit">
                    <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-3xl">
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to My Causes
                    </Button>
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 min-w-0">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                            {project.title}
                        </h1>
                        <div className="flex items-center gap-2 mt-2 min-w-0">
                            <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold text-[11px] rounded-3xl px-2.5 truncate max-w-full">
                                Management Console
                            </Badge>
                            {isFullyCompleted && (
                                <Badge className="bg-emerald-500 text-white font-bold text-[11px] rounded-3xl border-0 shrink-0">{completedText}</Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start min-w-0">

                <div className="lg:col-span-8 space-y-6 min-w-0">

                    {finalReport && (
                        <Card className="rounded-3xl border-emerald-500/20 bg-emerald-500/[0.03] shadow-sm overflow-hidden animate-in slide-in-from-top-2 min-w-0">
                            <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/10 py-4 px-6 flex flex-row items-center gap-3 min-w-0">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                <CardTitle className="text-sm font-bold text-emerald-800 truncate">Final impact report</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-6 min-w-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center min-w-0">
                                    <div className="space-y-3 min-w-0">
                                        <h4 className="text-lg font-bold text-emerald-950 leading-tight break-words">{finalReport.title}</h4>
                                        <p className="text-sm text-emerald-900/80 font-medium leading-relaxed break-words">
                                            {finalReport.content}
                                        </p>
                                    </div>
                                    {finalReport.imageUrl && (
                                        <div className="relative aspect-video rounded-2xl overflow-hidden border-emerald-500/20 shadow-md min-w-0">
                                            <Image src={finalReport.imageUrl} alt="Impact" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!isFullyCompleted && (
                        <Card className="rounded-3xl border-border/40 bg-card overflow-hidden shadow-sm min-w-0">
                            <CardHeader className="border-b border-border/40 p-6 md:p-8 bg-muted/10 min-w-0">
                                <CardTitle className="text-base font-bold flex items-center gap-3 truncate text-foreground">
                                    <Activity className="h-5 w-5 text-primary shrink-0" />
                                    <span className="truncate">Stage {currentPhaseIndex + 1} monitoring active</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8 space-y-4 min-w-0">
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    This cause is currently in the execution phase. The Givar team is coordinating directly with the assigned institutions and vendors to verify deliverables. Once execution is confirmed, the project status and public ledger will be updated automatically.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {otherUpdates.length > 0 && (
                        <div className="space-y-4 min-w-0">
                            <div className="flex items-center gap-3 px-1 min-w-0">
                                <Megaphone className="h-4 w-4 text-primary shrink-0" />
                                <h4 className="text-sm font-bold text-foreground truncate">Project updates</h4>
                            </div>
                            <div className="grid gap-3 min-w-0">
                                {otherUpdates.map((update) => (
                                    <Card key={update.id} className="rounded-3xl border-border/40 bg-card p-5 shadow-sm min-w-0">
                                        <div className="flex justify-between items-start gap-4 min-w-0">
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <Badge variant="secondary" className="text-[10px] font-bold rounded-3xl bg-muted border-none mb-1">
                                                    {update.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
                                                </Badge>
                                                <h5 className="text-sm font-bold text-foreground truncate">{update.title}</h5>
                                                <p className="text-sm text-muted-foreground font-medium leading-relaxed break-words">{update.content}</p>
                                            </div>
                                            <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap shrink-0">{formatDate(update.createdAt).split(',')[0]}</span>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 min-w-0 pt-4">
                        <div className="mb-6 px-1">
                            <h3 className="text-sm font-bold text-foreground mb-1.5">Implementation Plan</h3>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                This cause is funded one item at a time. Once an item is fully funded and confirmed, the next becomes available.
                            </p>
                        </div>

                        <div className="rounded-3xl border border-border/40 bg-card shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/40 border-b border-border/40 text-[11px] font-bold text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4">Item</th>
                                        <th className="px-6 py-4 hidden md:table-cell">Recipient</th>
                                        <th className="px-6 py-4 hidden sm:table-cell">Amount</th>
                                        <th className="px-6 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40 text-xs">
                                    {budget.map((item: any, i: number) => {
                                        const itemStage = item.stage || 'Main Stage';

                                        const isItemCompleted = previousStages.includes(itemStage) || isFullyCompleted || isFundedState;
                                        const isItemCurrent = itemStage === currentStageName && !isFullyCompleted && !isFundedState && !isPhaseFull;
                                        const isItemFull = itemStage === currentStageName && isPhaseFull;

                                        let statusBadge;
                                        if (isItemCompleted) {
                                            statusBadge = <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 shadow-none gap-1 py-1 px-3 rounded-3xl whitespace-nowrap"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</Badge>;
                                        } else if (isItemCurrent || isItemFull) {
                                            statusBadge = <Badge className="bg-blue-50 text-blue-600 border-blue-200 shadow-none gap-1 py-1 px-3 rounded-3xl whitespace-nowrap"><Clock className="h-3.5 w-3.5" /> In Progress</Badge>;
                                        } else {
                                            statusBadge = <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-border/40 shadow-none gap-1 py-1 px-3 rounded-3xl whitespace-nowrap"><Clock className="h-3.5 w-3.5" /> Upcoming</Badge>;
                                        }

                                        const vendorName = item.vendorId
                                            ? vendors.find((v: any) => v.id === item.vendorId)?.name
                                            : (item.payTo || item.vendor || 'Pending vendor sourcing');

                                        return (
                                            <tr key={i} className={cn("transition-colors", (isItemCurrent || isItemFull) ? "bg-primary/[0.02]" : "hover:bg-muted/10")}>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-foreground text-sm mb-1.5">{item.description || item.item}</div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-none shadow-none px-2 py-0 rounded-3xl">
                                                            {item.costType || item.type}
                                                        </Badge>
                                                        <span className="text-[10px] font-bold text-muted-foreground tracking-tight px-2 border-l border-border/60">{itemStage}</span>
                                                    </div>
                                                    <div className="sm:hidden font-mono text-foreground font-bold mt-2">
                                                        {formatCurrency(((item.amount || item.cost || 0) * 100).toString(), project.currency)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell text-muted-foreground font-medium">{vendorName}</td>
                                                <td className="px-6 py-4 hidden sm:table-cell font-mono text-foreground font-bold tabular-nums">
                                                    {formatCurrency(((item.amount || item.cost || 0) * 100).toString(), project.currency)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end">
                                                        {statusBadge}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0 pt-6">
                        <FeedbackThread
                            projectId={project.id}
                            title="Direct line with Givar"
                        />
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6 min-w-0">

                    <Card className="rounded-3xl border-border/40 shadow-sm bg-card overflow-hidden min-w-0">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-5 min-w-0 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
                                <History className="h-4 w-4 text-primary" /> Recent Donations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 min-w-0">
                            {recentDonations.data && recentDonations.data.length > 0 ? (
                                <div className="divide-y divide-border/40">
                                    {recentDonations.data.map((donation: any) => (
                                        <div key={donation.id} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-foreground truncate">{donation.actorName}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">
                                                    {formatDate(donation.createdAt).split(',')[0]}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-bold text-foreground tabular-nums">
                                                    {formatCurrency(donation.amount, donation.currency)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center">
                                    <p className="text-xs text-muted-foreground italic font-medium">No donations yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden min-w-0">
                        <CardHeader className="bg-muted/30 border-b border-border/40 py-4 px-5 md:py-5 md:px-6 min-w-0">
                            <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2 truncate">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Verified by Givar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4 min-w-0">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                                    <VerIcon className="h-4 w-4 shrink-0" />
                                    <span className="text-xs font-medium truncate">{verLabel}</span>
                                </div>
                                <span className="text-xs font-bold text-foreground truncate max-w-[140px] text-right">
                                    {orgName}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                                    <Users className="h-4 w-4 shrink-0" />
                                    <span className="text-xs font-medium truncate">Donors</span>
                                </div>
                                <span className="text-xs font-bold text-foreground tabular-nums text-right">
                                    {project._count?.donations || 0}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                                    <FileText className="h-4 w-4 shrink-0" />
                                    <span className="text-xs font-medium truncate">Budget & Plan</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                                    <BadgeCheck className="h-4 w-4 shrink-0" />
                                    <span className="text-xs font-medium truncate">Legal Documents</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Audited
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-5 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-900/70 leading-relaxed font-medium">
                            <strong className="text-emerald-800">Givar Protocol:</strong> Funds are paid directly to verified institutions or service providers (such as hospitals or schools), not to organisers or individuals.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}