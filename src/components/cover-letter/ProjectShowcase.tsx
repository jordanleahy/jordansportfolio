
import React from 'react';
import { ProjectCard } from './ProjectCard';
import { ProjectData } from '@/data/coverLetterContent';

interface ProjectShowcaseProps {
  title: string;
  description: string;
  projects: ProjectData[];
  onProjectClick?: (project: ProjectData) => void;
}

export const ProjectShowcase: React.FC<ProjectShowcaseProps> = ({
  title,
  description,
  projects,
  onProjectClick
}) => {
  return (
    <div className="mt-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {description}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <ProjectCard 
            key={index} 
            project={project}
            onClick={onProjectClick ? () => onProjectClick(project) : undefined}
          />
        ))}
      </div>
    </div>
  );
};
