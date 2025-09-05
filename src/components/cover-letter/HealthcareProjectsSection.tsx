
import React from 'react';
import { ProjectShowcase } from './ProjectShowcase';
import { healthcareProjectsData } from '@/data/coverLetterContent';

interface HealthcareProjectsSectionProps {
  title?: string;
  description?: string;
}

export const HealthcareProjectsSection: React.FC<HealthcareProjectsSectionProps> = ({
  title = "Related Healthcare AI Experience",
  description = "Healthcare AI projects that demonstrate my experience with workflow automation and clinical decision support systems"
}) => {
  return (
    <ProjectShowcase
      title={title}
      description={description}
      projects={healthcareProjectsData}
    />
  );
};
