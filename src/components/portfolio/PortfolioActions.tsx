import React from 'react';
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";

interface JobApplication {
  job_description: string;
  job_description_link?: string;
  resume_link?: string;
  cover_letter_link?: string;
  created_at: string;
}

interface PortfolioActionsProps {
  jobApplication?: JobApplication;
}

export const PortfolioActions: React.FC<PortfolioActionsProps> = ({ jobApplication }) => {
  if (!jobApplication || (!jobApplication.resume_link && !jobApplication.job_description_link)) {
    return null;
  }

  return (
    <div className="mt-12 text-center">
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {jobApplication.resume_link && (
          <Button asChild size="lg">
            <a href={jobApplication.resume_link} target="_blank" rel="noopener noreferrer">
              <FileText className="w-5 h-5 mr-2" />
              View Resume
            </a>
          </Button>
        )}
        {jobApplication.job_description_link && (
          <Button asChild variant="outline" size="lg">
            <a href={jobApplication.job_description_link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-5 h-5 mr-2" />
              View Job Posting
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};