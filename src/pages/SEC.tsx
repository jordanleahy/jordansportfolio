import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Filter, X, TrendingUp, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";
import { PageLayout } from "@/components/layout/PageLayout";
import { SummaryCards } from "@/components/sec/SummaryCards";
import { OfferingsTableOptimized } from "@/components/sec/OfferingsTableOptimized";
import { FilterSidebar } from "@/components/sec/FilterSidebar";
import { CompanyModal } from "@/components/sec/CompanyModal";
import { AddVendorModal } from "@/components/vendors/AddVendorModal";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";


const SEC = () => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState(() => {
    const hasUrlParams = searchParams.toString();
    const urlFilters = {
      industries: searchParams.get('industries')?.split(',').filter(Boolean) || (hasUrlParams ? [] : ['Other Technology']),
      
      fullySold: searchParams.get('fullySold') === 'true',
      amountRanges: searchParams.get('amountRanges')?.split(',').filter(Boolean) || [],
      maxRaisedRanges: searchParams.get('maxRaisedRanges')?.split(',').filter(Boolean) || [],
      states: searchParams.get('states')?.split(',').filter(Boolean) || (hasUrlParams ? [] : ['NY']),
      useDefaultFilters: !hasUrlParams // Default view if no params
    };
    return urlFilters;
  });
  
  const [isDefaultView, setIsDefaultView] = useState(!searchParams.toString());

  const handleFiltersChange = (newFilters: any) => {
    const updatedFilters = { ...newFilters, useDefaultFilters: false };
    setFilters(updatedFilters);
    setIsDefaultView(false);
    
    // Update URL params for persistence
    const params = new URLSearchParams();
    if (updatedFilters.industries?.length) params.set('industries', updatedFilters.industries.join(','));
    
    if (updatedFilters.fullySold) params.set('fullySold', 'true');
    if (updatedFilters.amountRanges?.length) params.set('amountRanges', updatedFilters.amountRanges.join(','));
    if (updatedFilters.maxRaisedRanges?.length) params.set('maxRaisedRanges', updatedFilters.maxRaisedRanges.join(','));
    if (updatedFilters.states?.length) params.set('states', updatedFilters.states.join(','));
    
    setSearchParams(params);
  };

  const handleResetToDefault = () => {
    const defaultFilters = {
      industries: ['Other Technology'],
      
      fullySold: false,
      amountRanges: [],
      maxRaisedRanges: [],
      states: ['NY'],
      useDefaultFilters: true
    };
    setFilters(defaultFilters);
    setIsDefaultView(true);
    setSearchParams(new URLSearchParams()); // Clear URL params
  };
  const { toast } = useToast();

  const handleVendorAdded = () => {
    setIsAddVendorModalOpen(false);
    toast({
      title: "Success",
      description: "Vendor added successfully! You can find it in the Vendors section.",
    });
  };

  return (
    <PageLayout>
      <Helmet>
        <title>SEC Dashboard - Offerings & Capital Raises</title>
        <meta name="description" content="Track SEC offerings, capital raises, and company insights" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">{/* Padding handled by PageLayout */}
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
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => setIsAddVendorModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
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



        {/* Main Content - Full Width Layout */}
        <div className="pb-8 w-full">
          <div className="flex gap-3 items-start">
            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block w-64 flex-shrink-0 pl-4 sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
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

            {/* Main Table - Optimized - Full Width */}
            <div className="flex-1 min-w-0 pr-4">
              <OfferingsTableOptimized 
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

        {/* Add Vendor Modal */}
        <AddVendorModal
          isOpen={isAddVendorModalOpen}
          onClose={() => setIsAddVendorModalOpen(false)}
          onVendorAdded={handleVendorAdded}
        />
      </div>
    </PageLayout>
  );
};

export default SEC;
