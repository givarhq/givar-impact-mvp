'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Share2, Check, MapPin, UserCheck, ShieldCheck, BadgeCheck, Building2, Clock, Target } from 'lucide-react';
import { Button } from '../../ui/button';
import { ProjectCardProps } from '../../../types';
import { SmartCurrency } from '../../ui/smart-currency';
import { Card } from '../../ui/card';
import { motion } from 'framer-motion';
import { usePostHog } from 'posthog-js/react';

export const ProjectCard = memo(function ProjectCard({
  project,
  onShare,
  isPublic = false,
  hideKobo = true
}: ProjectCardProps) {
  const isCompleted = project.status === 'COMPLETED';

  // --- OVERALL PROJECT MATH ---
  const totalRaised = BigInt(project.raisedAmount || '0');
  const totalTarget = BigInt(project.targetAmount || '0');
  const isFundedState = project.status === 'FUNDED' || (totalRaised >= totalTarget && totalTarget > 0n && !isCompleted);

  const totalPercent = totalTarget > 0n
    ? Math.min(100, Math.floor(Number(totalRaised * 100n / totalTarget)))
    : 0;

  // --- PHASE CONTEXT (For Status Badge Only) ---
  const activeIndex = project.currentPhaseIndex || 0;
  const budget = Array.isArray(project.budgetBreakdown) ? project.budgetBreakdown : [];

  let previousPhasesMajor = 0;
  for (let i = 0; i < activeIndex && i < budget.length; i++) {
    previousPhasesMajor += (budget[i].amount || (budget[i] as any).cost || 0);
  }
  const previousPhasesMinor = BigInt(previousPhasesMajor * 100);

  let cumulativeMajor = previousPhasesMajor;
  if (budget[activeIndex]) {
    cumulativeMajor += (budget[activeIndex].amount || (budget[activeIndex] as any).cost || 0);
  }
  const phaseCapMinor = budget.length > 0 && activeIndex < budget.length
    ? BigInt(cumulativeMajor * 100)
    : totalTarget;

  const currentPhaseTargetMinor = phaseCapMinor - previousPhasesMinor;
  let raisedInCurrentPhase = totalRaised - previousPhasesMinor;
  if (raisedInCurrentPhase < 0n) raisedInCurrentPhase = 0n;

  const isPhaseFull = raisedInCurrentPhase >= currentPhaseTargetMinor && currentPhaseTargetMinor > 0n && !isFundedState && !isCompleted;

  const isMedical = project.categoryName?.toLowerCase() === 'medical';
  const completedText = isMedical ? 'Treatment Completed' : 'Impact Achieved';

  const detailsLink = isPublic ? `/explore/${project.slug}` : `/dashboard/impact/${project.slug}`;

  const getVerIcon = () => {
    if (project.organizerType === 'SYSTEM' || project.organizerName === 'Givar') return BadgeCheck;
    if (project.organizerType === 'ORGANIZATION') return Building2;
    return UserCheck;
  };

  const VerIcon = getVerIcon();
  const posthog = usePostHog();

  const handleProjectClick = () => {
    posthog?.capture('project_clicked', {
      project_id: project.id,
      project_title: project.title,
      is_verified: project.isVerifiedOrganizer
    });
  };

  const displayCategory = project.subcategoryName
    ? `${project.categoryName} • ${project.subcategoryName}`
    : (project.categoryName || 'Active cause');

  return (
    <Card
      onClick={handleProjectClick}
      className="group flex flex-row sm:flex-col rounded-3xl bg-card border-border/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full select-none"
    >
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
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-full bg-background/90 backdrop-blur-md text-primary border border-border/10 shadow-sm transition-transform duration-300 group-hover:scale-110" title={project.organizerType}>
            <VerIcon className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
        )}

        <div className="absolute top-3 left-3 hidden sm:flex items-center gap-1.5 bg-background/90 backdrop-blur-md text-foreground px-2.5 py-1 rounded-full border border-border/20 shadow-sm">
          <Target className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-bold truncate max-w-[140px]">{displayCategory}</span>
        </div>
      </Link>

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

        <div className="space-y-2 sm:space-y-3 mt-auto min-w-0 gap-2 sm:gap-3">
          {(isCompleted || isFundedState) ? (
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-600 mb-1">
              <Check className="h-3 w-3" /> {isCompleted ? completedText : 'Goal Reached'}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] sm:hidden font-bold text-primary mb-1 truncate">
              <Target className="h-3 w-3 shrink-0" /> <span className="truncate">{displayCategory}</span>
            </div>
          )}

          <div className="flex justify-between items-end gap-3 min-w-0">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex justify-between items-end text-xs font-bold min-w-0">
                <div className="flex items-baseline gap-1 truncate min-w-0">
                  <span className="text-foreground truncate">
                    <SmartCurrency amount={totalRaised.toString()} currency={project.currency} visible={true} size="small" hideKobo={hideKobo} />
                  </span>
                  <span className="text-muted-foreground text-[11px] font-medium shrink-0">of</span>
                  <span className="text-muted-foreground opacity-60 truncate font-medium">
                    <SmartCurrency amount={totalTarget.toString()} currency={project.currency} visible={true} size="small" hideKobo={hideKobo} />
                  </span>
                </div>
                <span className="text-primary shrink-0 ml-2">{totalPercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${totalPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});