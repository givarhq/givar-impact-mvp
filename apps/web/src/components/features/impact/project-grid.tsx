'use client';

import { useState } from 'react';
import { Project, Wallet } from '../../../types';
import { ProjectCard } from './project-card';
import { DonationModal } from '../donation/donation-modal';
import { ShareModal } from './share-modal';
import { SearchX } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

interface ProjectGridProps {
  projects: Project[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [shareProject, setShareProject] = useState<Project | null>(null); // State for sharing
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false); // State for share modal
  
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const handleDonateClick = (project: Project) => {
    if (!wallet) {
        apiClient.get('/wallet').then(res => setWallet(res.data)).catch(console.error);
    }
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleShareClick = (project: Project) => {
    setShareProject(project);
    setIsShareOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProject(null), 200);
  };

  if (projects.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-2xl bg-card/30">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <SearchX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No causes found</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
                Try adjusting your filters or search terms.
            </p>
        </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onDonate={handleDonateClick} 
            onShare={handleShareClick} // Pass share handler
          />
        ))}
      </div>

      <DonationModal 
        isOpen={isModalOpen} 
        onClose={handleClose} 
        project={selectedProject} 
        wallet={wallet}
      />

      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        projectTitle={shareProject?.title || ''}
        projectSlug={shareProject?.slug || ''}
      />
    </>
  );
}