import React from "react";
import { JobCard } from "./JobCard";
import type { Job } from "@/types/job";

interface JobListProps {
  jobs: Job[];
  bookmarkedJobs: string[];
  onBookmarkToggle: (jobId: string) => void;
}

export const JobList = ({ jobs, bookmarkedJobs, onBookmarkToggle }: JobListProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          isBookmarked={bookmarkedJobs.includes(job.id)}
          onBookmarkToggle={onBookmarkToggle}
        />
      ))}
    </div>
  );
};