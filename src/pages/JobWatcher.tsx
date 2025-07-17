import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Filter } from "lucide-react";
import Navigation from "@/components/Navigation";
import { JobList } from "@/components/jobs/JobList";
import { mockJobs } from "@/data/mockJobs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const JobWatcher = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>(() => {
    const saved = localStorage.getItem('bookmarked-jobs');
    return saved ? JSON.parse(saved) : [];
  });

  // Filter and sort jobs based on search and sort preferences
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = mockJobs;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime();
        case "company":
          return a.company.localeCompare(b.company);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [searchQuery, sortBy]);

  const handleBookmarkToggle = (jobId: string) => {
    const newBookmarks = bookmarkedJobs.includes(jobId)
      ? bookmarkedJobs.filter(id => id !== jobId)
      : [...bookmarkedJobs, jobId];
    
    setBookmarkedJobs(newBookmarks);
    localStorage.setItem('bookmarked-jobs', JSON.stringify(newBookmarks));
  };

  return (
    <>
      <Helmet>
        <title>Job Watcher - Product Designer Opportunities</title>
        <meta name="description" content="Track and discover Product Designer job opportunities from top companies" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <Navigation />
        
        {/* Header */}
        <div className="border-b bg-card pt-16">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Job Watcher</h1>
                <p className="text-muted-foreground mt-2">
                  Discover and track Product Designer opportunities from leading companies
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs or companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Latest</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="title">Job Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
              <span>{filteredAndSortedJobs.length} jobs found</span>
              <span>{bookmarkedJobs.length} bookmarked</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <JobList 
            jobs={filteredAndSortedJobs}
            bookmarkedJobs={bookmarkedJobs}
            onBookmarkToggle={handleBookmarkToggle}
          />
          
          {filteredAndSortedJobs.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-2">No jobs found</div>
              <p className="text-muted-foreground text-sm">
                Try adjusting your search terms or clearing filters
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default JobWatcher;