'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText, Clock, CheckCircle2, AlertCircle,
  MoreHorizontal, Trash2, Edit2, ArrowRight, XCircle,
  LayoutDashboard, Info
} from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { ConfirmModal } from '../../ui/confirm-modal';
import { ApiService } from '../../../services/api';
import { formatDate } from '../../../lib/utils/format';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';

interface ProposalCardProps {
  proposal: any;
}

const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
  DRAFT: { color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20', icon: FileText, label: 'Draft' },
  AWAITING_VERIFICATION: { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: Clock, label: 'Pending KYC' },
  SUBMITTED: { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: Clock, label: 'Submitted' },
  UNDER_REVIEW: { color: 'text-blue-600 bg-blue-600/10 border-blue-600/20', icon: Clock, label: 'In Review' },
  CHANGES_REQUESTED: { color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', icon: AlertCircle, label: 'More Info Required' },
  APPROVED: { color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, label: 'Live' },
  REJECTED: { color: 'text-destructive bg-destructive/10 border-destructive/20', icon: XCircle, label: 'Rejected' },
};

export const ProposalCard = memo(function ProposalCard({ proposal }: ProposalCardProps) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const baseConfig = statusConfig[proposal.status] || statusConfig.DRAFT;
  const config = { ...baseConfig };

  if (proposal.status === 'APPROVED' && proposal.projectStatus) {
    if (proposal.projectStatus === 'FUNDED') {
      config.label = 'Goal Reached';
    } else if (proposal.projectStatus === 'COMPLETED') {
      config.label = 'Impact Achieved';
    } else if (proposal.projectStatus === 'SUSPENDED') {
      config.label = 'Suspended';
      config.color = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      config.icon = AlertCircle;
    }
  }

  const StatusIcon = config.icon;

  const isEditable = ['DRAFT', 'CHANGES_REQUESTED'].includes(proposal.status);
  const isApproved = proposal.status === 'APPROVED';

  const onConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await ApiService.proposals.delete(proposal.id);
      toast.success('Deleted Successfully');
      setIsConfirmOpen(false);
      router.refresh();
    } catch (e) {
      toast.error('Delete Failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const linkTarget = isApproved
    ? `/dashboard/projects/${proposal.id}/manage`
    : isEditable
      ? `/dashboard/proposals/edit/${proposal.id}/hook`
      : `/dashboard/proposals/status/${proposal.id}`;

  return (
    <>
      <Card className="group flex flex-col h-full bg-card rounded-3xl border-border/40 shadow-sm transition-all duration-200 hover:shadow-md min-w-0">
        <CardContent className="p-3 sm:p-4 flex flex-col h-full gap-2.5 sm:gap-3 min-w-0">

          {/* Card Header: Status & Context */}
          <div className="flex justify-between items-start gap-2 min-w-0 shrink-0">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-bold tracking-wider transition-colors min-w-0 truncate",
              config.color
            )}>
              <StatusIcon className="h-3 w-3 shrink-0" />
              <span className="truncate">{config.label}</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground outline-none transition-colors shrink-0 active:scale-95">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-3xl p-1 shadow-xl border-border/40 bg-card">
                {isApproved && (
                  <DropdownMenuItem onClick={() => router.push(linkTarget)} className="gap-2.5 cursor-pointer rounded-2xl font-bold text-xs py-2.5">
                    <LayoutDashboard className="h-4 w-4" /> Manage Impact
                  </DropdownMenuItem>
                )}
                {isEditable && (
                  <DropdownMenuItem onClick={() => router.push(linkTarget)} className="gap-2.5 cursor-pointer rounded-2xl font-bold text-xs py-2.5">
                    <Edit2 className="h-4 w-4" /> Edit Cause
                  </DropdownMenuItem>
                )}
                {!isApproved && !isEditable && (
                  <DropdownMenuItem onClick={() => router.push(linkTarget)} className="gap-2.5 cursor-pointer rounded-2xl font-bold text-xs py-2.5">
                    <Info className="h-4 w-4" /> View Status
                  </DropdownMenuItem>
                )}
                {(proposal.status === 'DRAFT' || proposal.status === 'REJECTED' || proposal.status === 'CHANGES_REQUESTED') && (
                  <DropdownMenuItem
                    onClick={() => setIsConfirmOpen(true)}
                    className="gap-2.5 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-2xl font-bold text-xs py-2.5"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Draft
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content Body: Narrative */}
          <div className="flex-1 min-w-0 flex flex-col">
            <Link href={linkTarget} className={cn("block space-y-1 min-w-0 mb-2.5", (proposal.status !== 'APPROVED' && !isEditable && proposal.status !== 'CHANGES_REQUESTED') && "cursor-pointer")}>
              <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-1 sm:line-clamp-2 group-hover:text-primary transition-colors min-w-0">
                {proposal.title || 'Untitled Draft'}
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-snug font-medium min-w-0">
                {proposal.shortDesc || 'Initial Proposal Draft Pending Further Details.'}
              </p>
            </Link>

            <div className="mt-auto flex flex-wrap items-center gap-2 min-w-0">
              <span className="bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full border border-border/40 text-[10px] font-bold tracking-wide truncate max-w-[100px] sm:max-w-[120px]">
                {proposal.category?.name || 'Impact'}
              </span>
              <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60 tracking-tight shrink-0">
                <Clock className="h-3 w-3" /> {formatDate(proposal.updatedAt).split(',')[0]}
              </div>
            </div>
          </div>

          {/* Action Button: Footer Area */}
          <div className="shrink-0 mt-1">
            {isApproved ? (
              <Link href={linkTarget} className="block w-full">
                <Button variant="outline" className="w-full h-9 rounded-full border-border/60 bg-background text-foreground hover:bg-muted font-bold text-xs gap-1.5 shadow-sm transition-all active:scale-[0.98]">
                  Open Console <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </Link>
            ) : isEditable ? (
              <Link href={linkTarget} className="block w-full">
                <Button variant="outline" className="w-full h-9 rounded-full bg-muted/30 text-foreground hover:bg-muted font-bold text-xs gap-1.5 border-border/60 transition-all active:scale-[0.98]">
                  Continue Editing <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <Link href={linkTarget} className="block w-full">
                <div className="flex items-center justify-center gap-1.5 h-9 w-full rounded-full border border-dashed border-border/60 bg-muted/10 text-[11px] font-bold text-muted-foreground hover:bg-muted/30 transition-colors active:scale-[0.98] cursor-pointer">
                  <Clock className="h-3.5 w-3.5" /> View Status
                </div>
              </Link>
            )}
          </div>

        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onConfirmDelete}
        isLoading={isDeleting}
        variant="destructive"
        title="Delete Proposal"
        description="Permanently remove this cause? This action is irreversible."
        confirmText="Confirm Delete"
      />
    </>
  );
});