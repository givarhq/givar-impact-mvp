'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Share2, Check, MapPin, UserCheck, ShieldCheck, BadgeCheck } from 'lucide-react';
import { Button } from '../../ui/button';
import { Project } from '../../../types';
import { SmartCurrency } from '../../ui/smart-currency';
import { Card } from '../../ui/card';
import { motion } from 'framer-motion';

interface ProjectCardProps {
  project: Project & { categoryName?: string; donorCount?: number };
  onDonate: (project: Project) => void;
  onShare: (project: Project) => void;
  isPublic?: boolean;
}

export const ProjectCard = memo(function ProjectCard({ project, onDonate, onShare, isPublic = false }: ProjectCardProps) {
  const raised = Number(project.raisedAmount || 0);
  const target = Number(project.targetAmount || 0);
  const percent = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
  const isFunded = project.status === 'FUNDED' || project.status === 'COMPLETED' || (raised >= target && target > 0);

  const detailsLink = isPublic ? `/explore/${project.slug}` : `/dashboard/impact/${project.slug}`;

  const getVerIcon = () => {
    if (project.organizerType === 'SYSTEM') return BadgeCheck;
    if (project.organizerType === 'ORGANIZATION') return ShieldCheck;
    return UserCheck;
  };

  const VerIcon = getVerIcon();

  return (
    <Card className="group flex flex-row sm:flex-col rounded-3xl bg-card border-border/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full select-none">
      {/* Visual Header */}
      <Link href={detailsLink} className="relative block w-[110px] sm:w-full shrink-0 sm:aspect-video bg-muted border-r sm:border-r-0 sm:border-b border-border/40 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        {project.imageUrl ? (
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 110px, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
            <Heart className="h-8 w-8 sm:h-10 sm:w-10 fill-current" />
          </div>
        )}

        {project.isVerifiedOrganizer && (
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-full bg-background/90 backdrop-blur-md text-primary border border-border/10 shadow-sm transition-transform duration-300 group-hover:scale-110">
            <VerIcon className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
        )}
      </Link>

      {/* Content Body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between min-w-0 gap-2 sm:gap-3">
        <div className="space-y-1 sm:space-y-1.5 min-w-0">
          <Link href={detailsLink} className="block min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-md">
            <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-2 sm:line-clamp-1 group-hover:text-primary transition-colors">
              {project.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground tracking-wider min-w-0">
            <span className="text-foreground font-bold truncate max-w-[90px] sm:max-w-[120px]">{project.organizerName}</span>
            <span className="shrink-0">•</span>
            <span className="flex items-center gap-1 truncate min-w-0">
              <MapPin className="h-2.5 w-2.5 shrink-0" /> <span className="truncate">{project.location || 'Global'}</span>
            </span>
          </div>
        </div>

        {/* Impact Progress & Actions */}
        <div className="space-y-2 sm:space-y-3 mt-auto min-w-0">
          {isFunded && (
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-600 mb-1">
              <Check className="h-3 w-3" /> Fully Funded
            </div>
          )}
          <div className="flex justify-between items-end gap-3 min-w-0">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex justify-between items-end text-xs font-bold min-w-0">
                <div className="flex items-baseline gap-1 truncate min-w-0">
                  <span className="text-foreground truncate">
                    <SmartCurrency amount={project.raisedAmount} currency={project.currency} visible={true} size="small" />
                  </span>
                  <span className="text-muted-foreground text-[10px] font-medium shrink-0">of</span>
                  <span className="text-muted-foreground opacity-60 truncate font-medium">
                    <SmartCurrency amount={project.targetAmount} currency={project.currency} visible={true} size="small" />
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-primary"
                />
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShare(project);
              }}
              className="hidden sm:inline-flex h-9 w-9 shrink-0 rounded-full border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted active:scale-90 transition-all bg-background"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
});