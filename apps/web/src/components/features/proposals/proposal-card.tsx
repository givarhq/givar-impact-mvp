'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText, Clock, CheckCircle2, AlertCircle,
  MoreHorizontal, Trash2, Edit2, ArrowRight, XCircle,
  LayoutDashboard
} from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { ApiService } from '../../../services/api';
import { formatDate } from '../../../lib/utils/format';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils/cn';

interface ProposalCardProps {
  proposal: any;
}

const statusConfig: Record<string, { color: string, icon: any, label: string }> = {
  DRAFT: { color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20', icon: FileText, label: 'Draft' },
  AWAITING_VERIFICATION: { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: Clock, label: 'Awaiting Verification' },
  SUBMITTED: { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: Clock, label: 'Submitted' },
  UNDER_REVIEW: { color: 'text-blue-600 bg-blue-600/10 border-blue-600/20', icon: Clock, label: 'Under Review' },
  CHANGES_REQUESTED: { color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', icon: AlertCircle, label: 'Needs Edits' },
  APPROVED: { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, label: 'Live Project' },
  REJECTED: { color: 'text-destructive bg-destructive/10 border-destructive/20', icon: XCircle, label: 'Rejected' },
};

export function ProposalCard({ proposal }: ProposalCardProps) {
  const router = useRouter();
  const config = statusConfig[proposal.status] || statusConfig.DRAFT;
  const StatusIcon = config.icon;

  const isEditable = ['DRAFT', 'CHANGES_REQUESTED'].includes(proposal.status);
  const isApproved = proposal.status === 'APPROVED';

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      await ApiService.proposals.delete(proposal.id);
      toast.success('Draft deleted');
      router.refresh();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  // Context-aware link targeting
  const linkTarget = isApproved
    ? `/dashboard/projects/${proposal.id}/manage`
    : isEditable
      ? `/dashboard/proposals/edit/${proposal.id}/hook`
      : '#';

  return (
    <div className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-border/50 to-transparent hover:from-primary/20 transition-all duration-300 hover:-translate-y-1">
      <Card className="h-full bg-card rounded-[15px] p-5 flex flex-col justify-between border-none shadow-sm relative overflow-hidden">

        {/* Background Status Indicator (Subtle) */}
        <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 pointer-events-none", config.color.split(' ')[0].replace('text', 'bg'))} />

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <Badge variant="outline" className={cn("gap-1.5 pl-1.5 pr-2.5 py-1 rounded-lg border font-bold tracking-widest text-[9px] uppercase", config.color)}>
            <StatusIcon className="h-3 w-3" />
            <span>{config.label}</span>
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground rounded-xl">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl border-border/50">
              {isApproved && (
                <DropdownMenuItem onClick={() => router.push(linkTarget)} className="gap-2 cursor-pointer rounded-lg font-medium">
                  <LayoutDashboard className="h-4 w-4" /> Manage Impact
                </DropdownMenuItem>
              )}
              {isEditable && (
                <DropdownMenuItem onClick={() => router.push(linkTarget)} className="gap-2 cursor-pointer rounded-lg font-medium">
                  <Edit2 className="h-4 w-4" /> Continue Editing
                </DropdownMenuItem>
              )}
              {(proposal.status === 'DRAFT' || proposal.status === 'REJECTED' || proposal.status === 'CHANGES_REQUESTED') && (
                <DropdownMenuItem onClick={handleDelete} className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg font-medium">
                  <Trash2 className="h-4 w-4" /> Delete Draft
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <Link href={linkTarget} className={cn("block flex-1 mb-6", (proposal.status !== 'APPROVED' && !isEditable) && "cursor-default")}>
          <h3 className="font-bold text-base text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {proposal.title || 'Untitled Draft'}
          </h3>
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
            {proposal.shortDesc || 'No description provided yet.'}
          </p>

          {/* Meta Info */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
            <span className="bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">
              {proposal.category?.name || 'Uncategorized'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Updated {formatDate(proposal.updatedAt).split(',')[0]}
            </span>
          </div>
        </Link>

        {/* Footer Action */}
        <div className="pt-4 border-t border-border/50">
          {isApproved ? (
            <Link href={linkTarget}>
              <Button className="w-full h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-bold text-xs gap-2 shadow-lg shadow-primary/20 border-0">
                Manage Impact <LayoutDashboard className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : isEditable ? (
            <Link href={linkTarget}>
              <Button className="w-full h-10 rounded-xl bg-secondary text-secondary-foreground hover:bg-primary hover:text-white transition-all font-bold text-xs gap-2 shadow-none border-0">
                Continue Editing <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <div className="flex items-center justify-center gap-2 h-10 w-full rounded-xl border border-dashed border-border bg-muted/20 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Clock className="h-3 w-3" /> Under Review
            </div>
          )}
        </div>

      </Card>
    </div>
  );
}