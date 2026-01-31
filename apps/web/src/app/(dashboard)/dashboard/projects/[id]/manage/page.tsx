import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ApiService } from '../../../../../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    Clock,
    Database,
    ShieldCheck,
    AlertCircle,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { EvidenceSubmission } from '../../../../../../components/features/proposals/evidence-submission';
import { cn } from '../../../../../../lib/utils/cn';
import { formatCurrency, formatDate } from '../../../../../../lib/utils/format';

export default async function ProjectManagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;
    if (!token) redirect('/login');

    const project = await ApiService.projects.getOwnerView(id, token);
    if (!project) notFound();

    const timeline = Array.isArray(project.executionTimeline) ? project.executionTimeline : [];

    // Find the earliest phase that isn't completed to show as "Active"
    const currentMilestone = timeline.find((m: any) => m.status === 'IN_PROGRESS') ||
        timeline.find((m: any) => m.status === 'PENDING');

    const isFullyCompleted = timeline.every((m: any) => m.status === 'COMPLETED');

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-24">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <Link href="/dashboard/proposals">
                        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-xl">
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to My Causes
                        </Button>
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                        {project.title}
                    </h1>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px] py-1 px-3 rounded-lg">
                            Management Console
                        </Badge>
                        {isFullyCompleted && (
                            <Badge className="bg-emerald-500 text-white font-bold text-[10px] uppercase rounded-lg">Project Completed</Badge>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* --- LEFT COLUMN: ACTION & ROADMAP --- */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Submission */}
                    {!isFullyCompleted && currentMilestone ? (
                        <div className="group relative rounded-[32px] p-[1px] bg-gradient-to-br from-primary/30 via-border/50 to-transparent shadow-2xl shadow-primary/5">
                            <Card className="border-none bg-card/50 backdrop-blur-xl rounded-[31px] overflow-hidden">
                                <CardHeader className="border-b border-border/50 p-6 md:p-8">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl font-bold flex items-center gap-3">
                                            <Camera className="h-6 w-6 text-primary" />
                                            <span className="text-foreground">Submit Progress Evidence</span>
                                        </CardTitle>
                                        <Badge className="bg-primary/10 text-primary border-0 rounded-md py-1">
                                            {currentMilestone.phase}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8">
                                    <EvidenceSubmission
                                        projectId={id}
                                        milestone={currentMilestone}
                                        onSuccess={() => { }}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    ) : isFullyCompleted ? (
                        <Card className="rounded-[32px] border-emerald-500/20 bg-emerald-500/[0.02] p-10 text-center border-2 border-dashed">
                            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">Mission Accomplished</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                                Every phase of this project has been executed and verified. Thank you for your incredible work on the ground.
                            </p>
                        </Card>
                    ) : null}

                    {/* Execution Roadmap Table */}
                    <Card className="rounded-[32px] border-border/50 bg-card/30 shadow-sm overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Execution Roadmap
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-4">
                            <div className="space-y-8 relative">
                                <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-border hidden sm:block" />

                                {timeline.map((m: any, i: number) => {
                                    const isDone = m.status === 'COMPLETED';
                                    const isCurrent = m.id === currentMilestone?.id;

                                    return (
                                        <div key={i} className="flex gap-6 relative group">
                                            <div className="flex flex-col items-center shrink-0 relative z-10">
                                                <div className={cn(
                                                    "h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 bg-background",
                                                    isDone ? "bg-primary border-primary text-white" :
                                                        isCurrent ? "border-primary text-primary animate-pulse ring-4 ring-primary/10" :
                                                            "border-border text-muted-foreground"
                                                )}>
                                                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                                                </div>
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <h4 className={cn("font-bold text-sm", isDone || isCurrent ? "text-foreground" : "text-muted-foreground")}>
                                                        {m.phase}
                                                    </h4>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[9px] uppercase font-black px-2 rounded-md",
                                                        isDone ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-muted-foreground"
                                                    )}>
                                                        {m.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.deliverables}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- RIGHT COLUMN: FINANCIALS & TRUST --- */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Verified Status Card */}
                    <Card className="rounded-[28px] border-border/50 bg-primary/5 p-6 border-2 border-dashed">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-primary uppercase tracking-tighter">Direct Procurement Mode</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Givar Management handles all vendor payments directly to ensure financial integrity. Your role is to verify deliveries.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Disbursement History */}
                    <Card className="rounded-[28px] border-border/50 shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-muted/40 border-b border-border/50 py-4 px-6">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Database className="h-4 w-4" /> Disbursement History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {project.disbursements?.length > 0 ? (
                                project.disbursements.map((d: any) => (
                                    <div key={d.id} className="p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-2 hover:bg-muted/30 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-tight">Payment Disbursed</p>
                                            <span className="text-[10px] font-mono text-muted-foreground">{formatDate(d.createdAt).split(',')[0]}</span>
                                        </div>
                                        <p className="text-lg font-bold text-foreground tabular-nums">
                                            {formatCurrency(d.amount, project.currency)}
                                        </p>
                                        <div className="pt-2 border-t border-border/50 space-y-1">
                                            <p className="text-[11px] font-medium text-foreground"><span className="text-muted-foreground">Vendor:</span> {d.vendorName}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono truncate">Ref: {d.reference}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <Clock className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                    <p className="text-xs text-muted-foreground italic">Awaiting first disbursement from Givar treasury.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Support Nudge */}
                    <div className="p-6 rounded-[28px] bg-secondary/30 border border-border/50 flex items-start gap-4">
                        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Need help with execution or vendor coordination? Contact your assigned Givar Portfolio Manager directly.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}