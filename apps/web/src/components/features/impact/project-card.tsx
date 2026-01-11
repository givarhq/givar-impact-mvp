'use client';

import { Heart } from 'lucide-react';
import { Button } from '../../ui/button';
import { ProjectCardProps } from '../../../types';
import { formatCurrency } from '../../../lib/utils/format';

export function ProjectCard({ project, onDonate }: ProjectCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
      {/* Image Placeholder / Area */}
      <div className="h-48 w-full bg-muted/50 relative overflow-hidden">
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
        
        {/* Badge */}
        <div className="absolute top-3 right-3 rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-semibold text-foreground backdrop-blur-sm shadow-sm">
            {project.currency}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold tracking-tight text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        </div>

        <div className="mt-auto space-y-3">
          {/* Progress Section */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-foreground">
                {formatCurrency(project.raisedAmount, project.currency)}
              </span>
              <span className="text-muted-foreground">
                of {formatCurrency(project.targetAmount, project.currency)}
              </span>
            </div>
            {/* SOTA Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${project.percentFunded}%` }}
              />
            </div>
          </div>

          <Button 
            onClick={() => onDonate(project)}
            className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground shadow-none hover:shadow-md transition-all"
          >
            Donate Now
          </Button>
        </div>
      </div>
    </div>
  );
}