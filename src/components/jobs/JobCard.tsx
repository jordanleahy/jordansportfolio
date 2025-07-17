import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, ExternalLink, MapPin, Calendar, Building } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Job {
  id: string;
  title: string;
  company: string;
  platform: string;
  location: string;
  datePosted: string;
  applicationUrl: string;
  description: string;
  type: string;
  salary?: string;
}

interface JobCardProps {
  job: Job;
  isBookmarked: boolean;
  onBookmarkToggle: (jobId: string) => void;
}

export const JobCard = ({ job, isBookmarked, onBookmarkToggle }: JobCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="group transition-all duration-200 hover:shadow-md border-border/50 hover:border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Job Title */}
            <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-1">
              {job.title}
            </h3>
            
            {/* Company & Location */}
            <div className="flex items-center gap-4 text-muted-foreground text-sm mb-3">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                <span className="font-medium">{job.company}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
              {job.description}
            </p>
            
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-xs">
                {job.platform}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {job.type}
              </Badge>
              {job.salary && (
                <Badge variant="outline" className="text-xs">
                  {job.salary}
                </Badge>
              )}
            </div>
            
            {/* Date & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(job.datePosted)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmarkToggle(job.id);
                  }}
                  className={cn(
                    "h-8 w-8 p-0",
                    isBookmarked ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground"
                  )}
                >
                  <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8"
                >
                  <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Apply
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};