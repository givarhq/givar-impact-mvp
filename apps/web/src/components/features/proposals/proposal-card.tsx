'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, Clock, CheckCircle2, AlertCircle, 
  MoreHorizontal, Trash2, Edit2, ArrowRight, XCircle 
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
  SUBMITTED: { color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: Clock, label: 'Submitted' },
  UNDER_REVIEW: { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: Clock, label: 'Under Review' },
  CHANGES_REQUESTED: { color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', icon: AlertCircle, label: 'Needs Edits' },
  APPROVED: { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, label: 'Live Project' },
  REJECTED: { color: 'text-destructive bg-destructive/10 border-destructive/20', icon: XCircle, label: 'Rejected' },
};

export function ProposalCard({ proposal }: ProposalCardProps) {
  const router = useRouter();
  const config = statusConfig[proposal.status] || statusConfig.DRAFT;
  const StatusIcon = config.icon;
  
  const isEditable = ['DRAFT', 'CHANGES_REQUESTED'].includes(proposal.status);

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

  const linkTarget = isEditable 
    ? `/dashboard/proposals/edit/${proposal.id}/hook` 
    : '#';

  return (
    <div className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-border/50 to-transparent hover:from-primary/20 transition-all duration-300 hover:-translate-y-1">
      <Card className="h-full bg-card rounded-[15px] p-5 flex flex-col justify-between border-none shadow-sm relative overflow-hidden">
        
        {/* Background Status Indicator (Subtle) */}
        <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 pointer-events-none", config.color.split(' ')[0].replace('text', 'bg'))} />

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
            <Badge variant="outline" className={cn("gap-1.5 pl-1.5 pr-2.5 py-1 rounded-lg border", config.color)}>
                <StatusIcon className="h-3.5 w-3.5" />
                <span className="font-bold tracking-wide text-[10px] uppercase">{config.label}</span>
            </Badge>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                    {isEditable && (
                        <DropdownMenuItem onClick={() => router.push(linkTarget)} className="gap-2 cursor-pointer">
                            <Edit2 className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                    )}
                    {(proposal.status === 'DRAFT' || proposal.status === 'REJECTED') && (
                        <DropdownMenuItem onClick={handleDelete} className="gap-2 text-destructive focus:text-destructive cursor-pointer">
                            <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        {/* Content */}
        <Link href={linkTarget} className={cn("block flex-1 mb-6", !isEditable && "cursor-default")}>
            <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {proposal.title || 'Untitled Draft'}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {proposal.shortDesc || 'No description provided yet.'}
            </p>
            
            {/* Meta */}
            <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                <span className="bg-secondary/50 px-2 py-1 rounded-md">
                    {proposal.category?.name || 'Uncategorized'}
                </span>
                <span>Updated {formatDate(proposal.updatedAt).split(',')[0]}</span>
            </div>
        </Link>

        {/* Footer Action */}
        <div className="pt-4 border-t border-border/50">
            {isEditable ? (
                <Link href={linkTarget}>
                    <Button className="w-full h-10 rounded-xl bg-secondary text-secondary-foreground hover:bg-primary hover:text-white transition-all font-semibold text-xs gap-2 shadow-none">
                        Continue Editing <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </Link>
            ) : (
                <Button disabled variant="outline" className="w-full h-10 rounded-xl text-xs font-semibold border-dashed opacity-70">
                    Processing Request
                </Button>
            )}
        </div>

      </Card>
    </div>
  );
}