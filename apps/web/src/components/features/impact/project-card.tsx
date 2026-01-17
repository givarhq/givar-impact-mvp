'use client';

import { Heart, ShieldCheck, Share2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Project } from '../../../types';
import { SmartCurrency } from '../../ui/smart-currency';
import Link from 'next/link';

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

  const detailsLink = isPublic 
    ? `/explore/${project.slug}` 
    : `/dashboard/impact/${project.slug}`;

  return (
    <div className="group relative flex flex-col rounded-2xl p-[1px] bg-gradient-to-b from-border/50 to-transparent hover:from-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
      
      <div className="relative flex flex-col h-full overflow-hidden bg-card rounded-[15px]">
        
        <Link href={detailsLink} className="block flex-1">
            
            <div className="h-44 w-full bg-muted relative overflow-hidden group-hover:opacity-95 transition-opacity">
                {project.imageUrl ? (
                <img 
                    src={project.imageUrl} 
                    alt={project.title} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                ) : (
                <div className="flex h-full items-center justify-center bg-secondary/30 text-muted-foreground">
                    <Heart className="h-8 w-8 opacity-20" />
                </div>
                )}
                
                <div className="absolute top-2 left-2 flex gap-2">
                    <Badge variant="secondary" className="backdrop-blur-md bg-background/90 shadow-sm text-[10px] h-5 px-1.5">
                        {project.categoryName || 'General'}
                    </Badge>
                </div>
                <div className="absolute top-2 right-2">
                    <div className="bg-emerald-500/90 text-white p-0.5 rounded-full shadow-sm backdrop-blur-sm" title="Verified">
                        <ShieldCheck className="h-4 w-4" />
                    </div>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
                <div className="space-y-1">
                    <h3 className="font-bold text-base leading-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {project.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed h-10">
                        {project.description}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Raised / Goal</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-bold text-foreground">
                                    <SmartCurrency amount={project.raisedAmount} currency={project.currency} visible={true} size="small" className="text-sm" />
                                </span>
                                <span className="text-muted-foreground/50 text-xs">/</span>
                                <span className="text-muted-foreground">
                                    <SmartCurrency amount={project.targetAmount} currency={project.currency} visible={true} size="small" className="text-xs font-medium" />
                                </span>
                            </div>
                        </div>
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                            {percent.toFixed(0)}%
                        </span>
                    </div>

                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-1000 ease-out" 
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
            </div>
        </Link>

        <div className="p-4 pt-0 mt-auto flex gap-2">
            <Button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDonate(project);
                }}
                className="flex-1 h-9 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold shadow-none transition-all"
            >
                Donate
            </Button>
            
            <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onShare(project);
                }}
                className="h-9 w-9 rounded-xl border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
                <Share2 className="h-4 w-4" />
            </Button>
        </div>

      </div>
    </div>
  );
}