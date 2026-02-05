'use client';

import Link from 'next/link';
import { Heart, Share2, BadgeCheck, Check, Info } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Project } from '../../../types';
import { SmartCurrency } from '../../ui/smart-currency';
import { cn } from '../../../lib/utils/cn';

interface ProjectCardProps {
  project: Project & { categoryName?: string; donorCount?: number };
  onDonate: (project: Project) => void;
  onShare: (project: Project) => void;
  isPublic?: boolean;
}

export function ProjectCard({ project, onDonate, onShare, isPublic = false }: ProjectCardProps) {
  const raised = Number(project.raisedAmount || 0);
  const target = Number(project.targetAmount || 0);
  const percent = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
  const isFunded = (raised >= target && target > 0) || project.status === 'FUNDED' || project.status === 'COMPLETED';
  const detailsLink = isPublic ? `/explore/${project.slug}` : `/dashboard/impact/${project.slug}`;
  const donateLink = `${detailsLink}/donate`;

  return (
    <div className="group relative flex flex-col rounded-2xl p-[1px] bg-gradient-to-b from-border/50 to-transparent hover:from-primary/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
      <div className="relative flex flex-col h-full overflow-hidden bg-card rounded-[15px]">
        <Link href={detailsLink} className="block flex-1">
          <div className="h-48 w-full bg-muted relative overflow-hidden">
            {project.imageUrl ? (
              <img src={project.imageUrl} alt={project.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="flex h-full items-center justify-center bg-secondary/30 text-muted-foreground"><Heart className="h-8 w-8 opacity-20" /></div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-black/20 to-black/50 opacity-30 group-hover:opacity-10 transition-opacity" />

            <div className="absolute top-3 left-3 flex gap-2">
              <Badge variant="secondary" className="backdrop-blur-md bg-background/90 shadow-sm text-xs h-6 px-2">{project.categoryName || 'General'}</Badge>
            </div>

            {/* Quick Info Overlay */}
            <div className="absolute inset-0 p-4 bg-black/70 backdrop-blur-md flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <Info className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Quick Info</span>
                </div>
                <p className="text-sm text-zinc-300 mt-2 line-clamp-4">{project.shortDesc}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <span>Donors</span>
                  <span className="font-bold text-white">{project.donorCount || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <span>Remaining</span>
                  <span className="font-bold text-white"><SmartCurrency amount={(target - raised).toString()} currency={project.currency} visible={true} size="small" /></span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-base leading-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">{project.title}</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">by <span className="text-foreground">{project.organizerName}</span></p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex flex-col"><span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Raised</span>
                  <span className="font-bold text-foreground"><SmartCurrency amount={project.raisedAmount} currency={project.currency} visible={true} size="small" className="text-sm" /></span>
                </div>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">{percent.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-1000 ease-out" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>
        </Link>
        <div className="p-4 pt-0 mt-auto flex gap-2">
          {isFunded ? (
            <Button disabled className="flex-1 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 text-xs font-bold opacity-100 cursor-default"><Check className="mr-1.5 h-3.5 w-3.5" /> Funded</Button>
          ) : (
            <Link href={donateLink} className="flex-1"><Button className="w-full h-9 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold shadow-none transition-all">Donate</Button></Link>
          )}
          <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); onShare(project); }} className="h-9 w-9 rounded-xl border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"><Share2 className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}