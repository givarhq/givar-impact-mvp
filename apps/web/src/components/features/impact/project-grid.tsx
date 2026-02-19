'use client';

import React, { useState, memo } from 'react';
import { SearchX } from 'lucide-react';
import { getCookie } from 'cookies-next';
import { Project, Wallet } from '../../../types';
import { ProjectCard } from './project-card';
import { ShareModal } from './share-modal';
import { ApiService } from '../../../services/api';
import { AnimatePresence, motion } from 'framer-motion';

interface ProjectGridProps {
  projects: Project[];
  isPublic?: boolean;
}

export const ProjectGrid = memo(function ProjectGrid({ projects, isPublic = false }: ProjectGridProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [shareProject, setShareProject] = useState<Project | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const handleDonateClick = (project: Project) => {
    const token = getCookie('givar_token');

    if (token && !wallet) {
      ApiService.wallet.get()
        .then(setWallet)
        .catch((err) => {
          console.error("Wallet fetch skipped/failed:", err);
        });
    }

    setSelectedProject(project);
  };

  const handleShareClick = (project: Project) => {
    setShareProject(project);
    setIsShareOpen(true);
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5 min-w-0">
        <div className="h-14 w-14 bg-muted/50 rounded-3xl flex items-center justify-center mb-4 border border-border/40">
          <SearchX className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <h3 className="text-sm font-bold text-foreground tracking-tight">No causes found</h3>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-[240px] font-medium leading-relaxed">
          Try adjusting your active filters or searching for another term.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 min-w-0">
        <AnimatePresence mode="popLayout">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="min-w-0 flex-1"
            >
              <ProjectCard
                project={project}
                onDonate={handleDonateClick}
                onShare={handleShareClick}
                isPublic={isPublic}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        projectTitle={shareProject?.title || ''}
        projectSlug={shareProject?.slug || ''}
      />
    </div>
  );
});