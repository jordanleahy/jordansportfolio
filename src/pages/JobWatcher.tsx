import React, { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Filter, LogOut, Loader2, RefreshCw, Settings } from "lucide-react";
import Navigation from "@/components/Navigation";
import { JobList } from "@/components/jobs/JobList";
import { JobMonitoringDashboard } from "@/components/jobs/JobMonitoringDashboard";
import { jobService } from "@/services/jobService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";
import type { Job } from "@/types/job";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const JobWatcher = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isScrapingJobs, setIsScrapingJobs] = useState(false);
  const [activeTab, setActiveTab] = useState("jobs");
  const { toast } = useToast();

  // Auth state management
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Redirect unauthenticated users to auth page
        if (!session?.user) {
          window.location.href = '/auth';
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Redirect if not authenticated
      if (!session?.user) {
        window.location.href = '/auth';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load jobs and bookmarks when user is authenticated
  useEffect(() => {
    if (user) {
      loadJobs();
      loadBookmarks();
    }
  }, [user]);

  const loadJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const fetchedJobs = await jobService.getJobs({
        search: searchQuery,
        sortBy: sortBy
      });
      setJobs(fetchedJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const loadBookmarks = async () => {
    if (!user) return;
    
    try {
      const bookmarks = await jobService.getBookmarkedJobs(user.id);
      setBookmarkedJobs(bookmarks);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  // Reload jobs when search or sort changes
  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        loadJobs();
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, sortBy, user]);

  const handleBookmarkToggle = async (jobId: string) => {
    if (!user) return;

    try {
      const isBookmarked = await jobService.toggleBookmark(user.id, jobId);
      
      if (isBookmarked) {
        setBookmarkedJobs(prev => [...prev, jobId]);
        toast({
          title: "Bookmarked",
          description: "Job added to your bookmarks",
        });
      } else {
        setBookmarkedJobs(prev => prev.filter(id => id !== jobId));
        toast({
          title: "Removed",
          description: "Job removed from bookmarks",
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleScrapeJobs = async () => {
    setIsScrapingJobs(true);
    try {
      const result = await jobService.scrapeJobs();
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        // Reload jobs after scraping
        await loadJobs();
      }
    } catch (error) {
      console.error('Error scraping jobs:', error);
      toast({
        title: "Error",
        description: "Failed to scrape new jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScrapingJobs(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
      
      // Redirect to auth page
      window.location.href = '/auth';
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during sign out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if no user (redirect will happen)
  if (!user) {
    return null;
  }

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
                <h1 className="text-3xl font-bold tracking-tight">Job Monitoring System</h1>
                <p className="text-muted-foreground mt-2">
                  Real-time monitoring of Product Designer opportunities from ATS platforms
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {activeTab === "jobs" && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handleScrapeJobs}
                      disabled={isScrapingJobs}
                    >
                      {isScrapingJobs ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Scraping...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Manual Scan
                        </>
                      )}
                    </Button>
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
                  </>
                )}
                
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList>
                <TabsTrigger value="jobs">Job Results</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring Dashboard</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Stats */}
            {activeTab === "jobs" && (
              <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                <span>{jobs.length} jobs found</span>
                <span>{bookmarkedJobs.length} bookmarked</span>
                <span>Welcome, {user.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="jobs">
              {isLoadingJobs ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading jobs...</p>
                </div>
              ) : (
                <JobList 
                  jobs={jobs}
                  bookmarkedJobs={bookmarkedJobs}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              )}
              
              {!isLoadingJobs && jobs.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-muted-foreground text-lg mb-2">No jobs found</div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Try adjusting your search terms or run the monitoring system
                  </p>
                  <Button onClick={handleScrapeJobs} disabled={isScrapingJobs}>
                    {isScrapingJobs ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Manual Scan
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="monitoring">
              <JobMonitoringDashboard user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default JobWatcher;