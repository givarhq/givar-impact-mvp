'use client';

import { useState, useEffect } from 'react';
import { Project, Wallet } from '../../../types';
import { ProjectCard } from './project-card';
import { DonationModal } from '../donation/donation-modal';
import { apiClient } from '../../../lib/api-client';

interface ImpactFeedProps {
  projects: Project[];
}

export function ImpactFeed({ projects }: ImpactFeedProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  // SOTA: Fetch wallet balance on client to provide real-time data to the modal
  useEffect(() => {
    apiClient.get('/wallet')
      .then(res => setWallet(res.data))
      .catch(console.error);
  }, []);

  const handleDonateClick = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProject(null), 200);
  };

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            onDonate={handleDonateClick} 
          />
        ))}
      </div>

      {projects.length === 0 && (
          <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground">No active causes found at the moment.</p>
          </div>
      )}

      <DonationModal 
        isOpen={isModalOpen} 
        onClose={handleClose} 
        project={selectedProject} 
        wallet={wallet}
      />
    </>
  );
}