
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProjectData } from '@/data/coverLetterContent';

interface ProjectCardProps {
  project: ProjectData;
  onClick?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.open(project.link, '_blank');
    }
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader>
        <div className={`w-12 h-12 ${project.iconBg} rounded-lg flex items-center justify-center mb-4`}>
          <div className={`w-6 h-6 ${project.iconColor} rounded-full flex items-center justify-center`}>
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>
        <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
        <CardDescription className="text-sm">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <div className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
          View Case Study
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </CardContent>
    </Card>
  );
};
