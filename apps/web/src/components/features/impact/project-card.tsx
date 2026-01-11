'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Button } from '../../ui/button';
import { Project } from '../../../types';
import { formatCurrency } from '../../../lib/utils/format';

interface ProjectCardProps {
  project: Project;
  onDonate: (project: Project) => void;
}

export function ProjectCard({ project, onDonate }: ProjectCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
      
      {/* 1. Clickable Image Area */}
      <Link href={`/dashboard/impact/${project.slug}`} className="block relative h-48 w-full bg-muted/50 overflow-hidden cursor-pointer">
        {project.imageUrl ? (
          <img 
            src={project.imageUrl} 
            alt={project.title} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-primary/5 text-primary/20">
             <Heart className="h-12 w-12" />
          </div>
        )}
        
        {/* Currency Badge */}
        <div className="absolute top-3 right-3 rounded-lg bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-sm shadow-sm border border-border/50">
            {project.currency}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5 space-y-4">
        {/* 2. Clickable Content Area */}
        <Link href={`/dashboard/impact/${project.slug}`} className="space-y-2 block cursor-pointer">
          <h3 className="font-bold tracking-tight text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        </Link>

        <div className="mt-auto space-y-4">
          {/* Progress Bar (Visual Only) */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-foreground">
                {formatCurrency(project.raisedAmount, project.currency)}
              </span>
              <span className="text-muted-foreground">
                of {formatCurrency(project.targetAmount, project.currency)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${project.percentFunded}%` }}
              />
            </div>
          </div>

          {/* Donate Action - Stops propagation to allow modal open instead of navigation if clicked */}
          <Button 
            onClick={(e) => {
                e.stopPropagation();
                onDonate(project);
            }}
            className="w-full h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground shadow-none hover:shadow-md transition-all font-semibold"
          >
            Donate Now
          </Button>
        </div>
      </div>
    </div>
  );
}