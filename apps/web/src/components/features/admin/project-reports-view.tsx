'use client';

import React, { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { ApiService } from '../../../services/api';
import { formatDate } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { Flag, Loader2, CheckCircle2, XCircle, AlertTriangle, Info, Clock, Check, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Report {
    id: string;
    projectId: string;
    reporterEmail: string;
    reason: string;
    description: string | null;
    status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
    createdAt: string;
}

interface ProjectReportsViewProps {
    reports: Report[];
    projectId: string;
    projectStatus: string;
}

// Map the strict database enums back to human-readable strings for the Admin UI
const REPORT_REASON_MAP: Record<string, string> = {
    'UNAUTHORIZED_BENEFICIARY': 'I am the beneficiary and did not authorise this cause',
    'FRAUD': 'Fraudulent or misleading information',
    'INAPPROPRIATE': 'Inappropriate content',
    'OTHER': 'Other'
};

export const ProjectReportsView = memo(function ProjectReportsView({ reports, projectId, projectStatus }: ProjectReportsViewProps) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    // Resolution Form State
    const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
    const [feedback, setFeedback] = useState('');
    const [reinstateProject, setReinstateProject] = useState(false);

    const handleResolve = async () => {
        if (!selectedReport) return;
        if (!feedback.trim()) return toast.error("Resolution feedback is required.");

        setIsProcessing(true);
        const toastId = toast.loading("Recording administrative decision...");

        try {
            await ApiService.admin.resolveProjectReport(selectedReport.id, {
                status: resolutionStatus,
                feedback: feedback.trim(),
                reinstateProject: projectStatus === 'SUSPENDED' ? reinstateProject : false
            });

            toast.success("Dispute successfully resolved", { id: toastId });
            setSelectedReport(null);
            setFeedback('');
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Failed to resolve report", { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    const openResolutionModal = (report: Report) => {
        setSelectedReport(report);
        // Defaults: If they dismiss it (false alarm), they probably want to reinstate the project.
        setResolutionStatus('RESOLVED');
        setReinstateProject(false);
        setFeedback('');
    };

    if (reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5 min-w-0">
                <div className="h-14 w-14 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-4 border border-emerald-500/20">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">No active disputes</h3>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-[240px] font-medium leading-relaxed">
                    This cause has not received any community reports.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-w-0">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h3 className="text-base font-bold text-foreground">Community Reports</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1">Review and resolve disputes flagged by users.</p>
                </div>
                {projectStatus === 'SUSPENDED' && (
                    <Badge variant="destructive" className="h-7 px-3 rounded-3xl font-bold text-[10px] gap-1.5 shadow-none">
                        <AlertTriangle className="h-3 w-3" /> Suspended
                    </Badge>
                )}
            </div>

            <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                    {reports.map((report) => (
                        <motion.div
                            key={report.id}
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="min-w-0"
                        >
                            <Card className={cn(
                                "rounded-3xl border-border/40 shadow-sm overflow-hidden transition-all",
                                report.status === 'PENDING' ? "bg-card border-primary/20" : "bg-muted/10 opacity-70"
                            )}>
                                <CardContent className="p-5 md:p-6 space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <div className={cn(
                                                "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner",
                                                report.status === 'PENDING' ? "bg-destructive/10 text-destructive border-destructive/20" :
                                                    report.status === 'RESOLVED' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                        "bg-muted text-muted-foreground border-border/40"
                                            )}>
                                                {report.status === 'PENDING' ? <Flag className="h-5 w-5" /> :
                                                    report.status === 'RESOLVED' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                            </div>
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className={cn(
                                                        "rounded-3xl px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border shadow-none",
                                                        report.status === 'PENDING' ? "bg-destructive/5 text-destructive border-destructive/20" :
                                                            report.status === 'RESOLVED' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                                                "bg-muted text-muted-foreground border-border/60"
                                                    )}>
                                                        {report.status}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {formatDate(report.createdAt)}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-bold text-foreground leading-tight pt-1">
                                                    {REPORT_REASON_MAP[report.reason] || report.reason}
                                                </h4>
                                                <p className="text-xs text-muted-foreground font-mono">Reported by: {report.reporterEmail}</p>
                                            </div>
                                        </div>
                                        {report.status === 'PENDING' && (
                                            <Button
                                                onClick={() => openResolutionModal(report)}
                                                className="w-full md:w-auto shrink-0 rounded-3xl font-bold text-xs h-10 px-6 shadow-md bg-primary text-white hover:bg-primary/90 transition-all active:scale-95"
                                            >
                                                Resolve dispute
                                            </Button>
                                        )}
                                    </div>

                                    {report.description && (
                                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 ml-0 md:ml-13 mt-2">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Additional Context</p>
                                            <p className="text-xs font-medium text-foreground leading-relaxed italic break-words">
                                                "{report.description}"
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && !isProcessing && setSelectedReport(null)}>
                <DialogContent className="rounded-3xl border-none shadow-2xl bg-card p-6 md:p-8 max-w-md w-[95vw]">
                    <DialogHeader className="pb-2">
                        <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" /> Resolve Dispute
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 pt-2">
                        <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-1.5">
                            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Target Issue</p>
                            <p className="text-xs font-bold text-foreground leading-snug">
                                {REPORT_REASON_MAP[selectedReport?.reason || ''] || selectedReport?.reason}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground ml-1">Administrative decision</label>
                                <Select value={resolutionStatus} onValueChange={(v: 'RESOLVED' | 'DISMISSED') => setResolutionStatus(v)} disabled={isProcessing}>
                                    <SelectTrigger className="h-11 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-xl border-border/40">
                                        <SelectItem value="DISMISSED" className="text-xs font-bold py-2">False alarm (Dismiss)</SelectItem>
                                        <SelectItem value="RESOLVED" className="text-xs font-bold py-2 text-primary">Action taken (Resolved)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {projectStatus === 'SUSPENDED' && (
                                <div className="flex flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-border/40 bg-muted/10">
                                    <div className="space-y-0.5">
                                        <h4 className="text-xs font-bold text-foreground">Reinstate Project</h4>
                                        <p className="text-[10px] text-muted-foreground font-medium">Remove the suspension lock and reactivate donations.</p>
                                    </div>
                                    <button
                                        onClick={() => setReinstateProject(!reinstateProject)}
                                        className={cn(
                                            "relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/40",
                                            reinstateProject ? "bg-primary" : "bg-muted-foreground/20"
                                        )}
                                        disabled={isProcessing}
                                    >
                                        <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out", reinstateProject ? "translate-x-4" : "translate-x-0")} />
                                    </button>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[11px] font-bold text-muted-foreground">Resolution feedback</label>
                                </div>
                                <Textarea
                                    placeholder="Explain your decision. This will be securely emailed to both the reporter and the project organizer."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    className="min-h-[100px] rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm resize-none"
                                    disabled={isProcessing}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-border/40">
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedReport(null)}
                                disabled={isProcessing}
                                className="flex-1 rounded-3xl font-bold text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleResolve}
                                disabled={isProcessing || !feedback.trim()}
                                className="flex-1 rounded-3xl font-bold text-xs shadow-md border-0 bg-primary text-white hover:bg-primary/90"
                            >
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm resolution"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
});