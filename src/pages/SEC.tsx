import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { SummaryCards } from "@/components/sec/SummaryCards";
import { OfferingsTable } from "@/components/sec/OfferingsTable";
import { FilterSidebar } from "@/components/sec/FilterSidebar";
import { CompanyModal } from "@/components/sec/CompanyModal";
import { DateRangePicker } from "@/components/sec/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const SEC = () => {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [filters, setFilters] = useState({
    industries: [] as string[],
    amountRange: [0, 100000000] as [number, number],
    searchQuery: ""
  });

  return (
    <>
      <Helmet>
        <title>SEC Dashboard - Offerings & Capital Raises</title>
        <meta name="description" content="Track SEC offerings, capital raises, and company insights" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">SEC Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Track offerings, capital raises, and company insights from SEC filings
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <DateRangePicker 
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
                
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
                      onFiltersChange={setFilters}
                      onClose={() => setIsFilterOpen(false)}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="container mx-auto px-4 py-6">
          <SummaryCards dateRange={dateRange} filters={filters} />
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-8">
          <div className="flex gap-6">
            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <FilterSidebar 
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>

            {/* Main Table */}
            <div className="flex-1 min-w-0">
              <OfferingsTable 
                dateRange={dateRange}
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