import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Filter, X, TrendingUp, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";
import Navigation from "@/components/Navigation";
import { SummaryCards } from "@/components/sec/SummaryCards";
import { OfferingsTable } from "@/components/sec/OfferingsTable";
import { FilterSidebar } from "@/components/sec/FilterSidebar";
import { CompanyModal } from "@/components/sec/CompanyModal";
import { Badge } from "@/components/ui/badge";


const SEC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    industries: [] as string[],
    searchQuery: "",
    fullySold: false,
    useDefaultFilters: true // Start with default view
  });
  const [isDefaultView, setIsDefaultView] = useState(true);

  const handleFiltersChange = (newFilters: any) => {
    setFilters({ ...newFilters, useDefaultFilters: false });
    setIsDefaultView(false);
  };

  const handleResetToDefault = () => {
    setFilters({
      industries: [],
      searchQuery: "",
      fullySold: false,
      useDefaultFilters: true
    });
    setIsDefaultView(true);
  };
  const { toast } = useToast();

  // Auth state management
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>SEC Dashboard - Offerings & Capital Raises</title>
        <meta name="description" content="Track SEC offerings, capital raises, and company insights" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <Navigation />
        
        {/* Admin Bar for authenticated users */}
        {user && (
          <div className="fixed top-20 right-4 z-50">
            <div className="bg-card border rounded-lg p-3 shadow-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Logged in as: {user.email}
              </p>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="border-b bg-card pt-16">{/* Add padding-top for fixed nav */}
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Q2 Form D Filings</h1>
                <p className="text-muted-foreground mt-2">
                  Track offerings, capital raises, and company insights from SEC filings
                </p>
                {isDefaultView && (
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary" className="text-sm">
                      Default View: US Tech Companies (Fully Raised)
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {!isDefaultView && (
                  <Button variant="outline" size="sm" onClick={handleResetToDefault}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                )}
                {/* Mobile Filter Toggle */}
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <Filter className="h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <FilterSidebar 
                      filters={filters}
                      onFiltersChange={handleFiltersChange}
                      onClose={() => setIsFilterOpen(false)}
                    />
                    {!isDefaultView && (
                      <div className="mt-4 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleResetToDefault}
                          className="w-full"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset to Default View
                        </Button>
                      </div>
                    )}
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>


        {/* Summary Cards */}
        <div className="container mx-auto px-4 py-6">
          <SummaryCards filters={filters} />
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-8">
          <div className="flex gap-6">
            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <FilterSidebar 
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
              {!isDefaultView && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResetToDefault}
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default View
                  </Button>
                </div>
              )}
            </div>

            {/* Main Table */}
            <div className="flex-1 min-w-0">
              <OfferingsTable 
                filters={filters}
                onCompanySelect={setSelectedCompany}
              />
            </div>
          </div>
        </div>

        {/* Company Detail Modal */}
        <CompanyModal 
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      </div>
    </>
  );
};

export default SEC;