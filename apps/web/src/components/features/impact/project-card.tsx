'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Share2, Check, MapPin, UserCheck, ShieldCheck, BadgeCheck } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
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
  const donateLink = `${detailsLink}/donate`;

  // Logic: Use specific icons to represent entity types without text badges
  const getVerIcon = () => {
    if (project.organizerType === 'SYSTEM') return BadgeCheck;
    if (project.organizerType === 'ORGANIZATION') return ShieldCheck;
    return UserCheck;
  };

  const VerIcon = getVerIcon();

  return (
    <Card className="group flex flex-col rounded-3xl bg-card border-border/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Visual Header */}
      <Link href={detailsLink} className="relative aspect-video overflow-hidden bg-muted">
        {project.imageUrl ? (
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground/20">
            <Heart className="h-10 w-10 fill-current" />
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-background/90 backdrop-blur-md text-foreground border-none text-xs font-bold px-2 py-0.5 rounded-3xl shadow-sm">
            {project.categoryName || 'Impact'}
          </Badge>
        </div>

        {/* Verification Icon Overlay */}
        {project.isVerifiedOrganizer && (
          <div className="absolute bottom-3 right-3 h-7 w-7 flex items-center justify-center rounded-full bg-background/90 backdrop-blur-md text-primary border border-border/10 shadow-sm transition-transform duration-300 group-hover:scale-110">
            <VerIcon className="h-4 w-4" />
          </div>
        )}
      </Link>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="space-y-1">
          <Link href={detailsLink}>
            <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {project.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground tracking-wider">
            <span className="text-foreground font-bold truncate max-w-[120px]">{project.organizerName}</span>
            <span>•</span>
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-2.5 w-2.5" /> {project.location || 'Global'}
            </span>
          </div>
        </div>

        {/* Impact Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-end text-xs font-bold">
            <div className="flex items-baseline gap-1">
              <span className="text-muted-foreground">Raised:</span>
              <span className="text-foreground">
                <SmartCurrency amount={project.raisedAmount} currency={project.currency} visible={true} size="small" />
              </span>
            </div>
            <span className="text-primary">{percent.toFixed(0)}%</span>
          </div>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          {isFunded ? (
            <Button disabled className="flex-1 h-9 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold opacity-100">
              <Check className="mr-1 h-3 w-3" /> Fully Funded
            </Button>
          ) : (
            <Link href={donateLink} className="flex-1">
              <Button className="w-full h-9 rounded-3xl text-xs font-bold shadow-sm active:scale-95 transition-all">
                Donate
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShare(project);
            }}
            className="h-9 w-9 rounded-3xl border-border/60 text-muted-foreground hover:text-foreground active:scale-90 transition-all"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
});