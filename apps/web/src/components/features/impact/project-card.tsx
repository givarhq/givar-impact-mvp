'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, UserCheck, BadgeCheck, Building2, Target, ArrowRight, BookOpen } from 'lucide-react';
import { ProjectCardProps } from '../../../types';
import { SmartCurrency } from '../../ui/smart-currency';
import { Card } from '../../ui/card';
import { motion } from 'framer-motion';
import { usePostHog } from 'posthog-js/react';
import { calculatePhaseFunding } from '@givar/types';

// Utility to clean raw HTML tags and entities from descriptions for card previews
const cleanDescription = (text?: string | null) => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

export const ProjectCard = memo(function ProjectCard({
  project,
  onShare,
  isPublic = false,
  hideKobo = true
}: ProjectCardProps) {
  const posthog = usePostHog();
  const phaseMath = calculatePhaseFunding(project as any);

  const {
    isCompleted,
    isFundedState,
    totalRaised,
    totalTarget,
    totalPercent
  } = phaseMath;

  const isActuallyCompleted = isCompleted || project.status === 'COMPLETED';

  const detailsLink = isPublic ? `/explore/${project.slug}` : `/dashboard/impact/${project.slug}`;

  const getVerIcon = () => {
    if (project.organizerType === 'SYSTEM' || project.organizerName === 'Givar') return BadgeCheck;
    if (project.organizerType === 'CORPORATE') return Building2;
    return UserCheck;
  };

  const VerIcon = getVerIcon();

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

  // --- COMPLETED CARD LAYOUT (Image 1 Mockup) ---
  if (isActuallyCompleted) {
    return (
      <Link href={detailsLink} onClick={handleProjectClick} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-3xl">
        <Card className="group flex flex-col sm:flex-row rounded-3xl bg-card border-border/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full select-none p-4 gap-4">
          {/* Left Thumbnail */}
          <div className="relative w-full sm:w-[170px] aspect-[4/3] rounded-2xl overflow-hidden bg-muted shrink-0">
            {project.imageUrl ? (
              <Image
                src={project.imageUrl}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 100vw, 170px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                <Heart className="h-8 w-8 fill-current" />
              </div>
            )}
          </div>

          {/* Right Details */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 mb-1.5">
                Completed
              </span>
              <h3 className="font-bold text-base text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                {project.title}
              </h3>
              <p className="text-xs text-muted-foreground font-medium line-clamp-2 mt-1 leading-relaxed">
                {cleanDescription(project.shortDesc || project.description)}
              </p>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground font-medium text-[11px] truncate">
                <span className="flex items-center gap-1 truncate"><BookOpen className="h-3 w-3 shrink-0" /> {displayCategory}</span>
                <span className="shrink-0">|</span>
                <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" /> {project.location || 'Global'}</span>
              </div>
              <span className="text-primary font-bold text-xs flex items-center gap-1 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                View outcome <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // --- ACTIVE CARD LAYOUT ---
  return (
    <Link href={detailsLink} onClick={handleProjectClick} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-3xl">
      <Card
        className="group flex flex-row sm:flex-col rounded-3xl bg-card border-border/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full select-none"
      >
        <div className="relative block w-[110px] sm:w-full shrink-0 sm:aspect-video bg-muted border-r sm:border-r-0 sm:border-b border-border/40 overflow-hidden">
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
        </div>

        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between min-w-0 gap-2 sm:gap-3">
          <div className="space-y-1 sm:space-y-1.5 min-w-0">
            <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-2 sm:line-clamp-1 group-hover:text-primary transition-colors">
              {project.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground tracking-wider min-w-0">
              <span className="text-foreground font-bold truncate max-w-[90px] sm:max-w-[120px]">{project.organizerName}</span>
              <span className="shrink-0">•</span>
              <span className="flex items-center gap-1 truncate min-w-0">
                <MapPin className="h-2.5 w-2.5 shrink-0" /> <span className="truncate">{project.location || 'Global'}</span>
              </span>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3 mt-auto min-w-0 gap-2 sm:gap-3">
            {isFundedState && (
              <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-600 mb-1">
                Goal Reached
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
    </Link>
  );
});