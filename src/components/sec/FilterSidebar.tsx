import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Filter, RotateCcw, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useIndustries } from "@/hooks/useSecQueries";
import { useDebounce } from "@/hooks/useDebounce";
interface FilterSidebarProps {
  filters: {
    industries: string[];
    searchQuery: string;
    fullySold?: boolean;
    amountRanges?: string[];
    maxRaisedRanges?: string[];
    states?: string[];
  };
  onFiltersChange: (filters: any) => void;
  onClose?: () => void;
}
export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFiltersChange,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || "");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Update filters immediately for non-search changes, debounced for search
  useEffect(() => {
    if (debouncedSearchQuery !== filters.searchQuery) {
      onFiltersChange({
        ...filters,
        searchQuery: debouncedSearchQuery
      });
    }
  }, [debouncedSearchQuery]);

  // Technology-focused industries only
  const techIndustries = ["Other Technology", "Computer Software", "Biotechnology", "Computer Hardware", "Internet", "Software", "Technology", "Telecommunications", "Computer Services", "Electronics", "Information Technology", "Media & Entertainment", "FinTech", "E-commerce"];

  // Amount ranges
  const amountRanges = ["Less than $500k", "$500k - $2MM", "$2MM - $5MM", "$5MM+"];

  // Max Raised ranges - specific ranges requested by user
  const maxRaisedRanges = ["Less than $250K", "$250K - $500K", "$500K - $1M", "$1M - $2M", "$2MM - $5MM", "$5MM - $10MM"];

  // States
  const states = [{
    code: "NY",
    name: "New York"
  }, {
    code: "NJ",
    name: "New Jersey"
  }, {
    code: "IL",
    name: "Illinois"
  }, {
    code: "CA",
    name: "California"
  }, {
    code: "TN",
    name: "Tennessee"
  }];
  const handleIndustryToggle = (industry: string) => {
    const updatedIndustries = filters.industries.includes(industry) ? filters.industries.filter(i => i !== industry) : [...filters.industries, industry];
    onFiltersChange({
      ...filters,
      industries: updatedIndustries
    });
  };
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };
  const handleAmountRangeToggle = (range: string) => {
    const updatedRanges = filters.amountRanges?.includes(range) ? filters.amountRanges.filter(r => r !== range) : [...(filters.amountRanges || []), range];
    onFiltersChange({
      ...filters,
      amountRanges: updatedRanges
    });
  };
  const handleMaxRaisedToggle = (range: string) => {
    const updatedRanges = filters.maxRaisedRanges?.includes(range) ? filters.maxRaisedRanges.filter(r => r !== range) : [...(filters.maxRaisedRanges || []), range];
    onFiltersChange({
      ...filters,
      maxRaisedRanges: updatedRanges
    });
  };
  const handleStateToggle = (stateCode: string) => {
    const updatedStates = filters.states?.includes(stateCode) ? filters.states.filter(s => s !== stateCode) : [...(filters.states || []), stateCode];
    onFiltersChange({
      ...filters,
      states: updatedStates
    });
  };
  const resetFilters = () => {
    const resetFilters = {
      industries: ['Other Technology'],
      searchQuery: "",
      fullySold: false,
      amountRanges: [],
      maxRaisedRanges: [],
      states: ['NY'],
      useDefaultFilters: true
    };
    setSearchQuery("");
    onFiltersChange(resetFilters);
  };
  const hasActiveFilters = filters.industries.length > 0 || searchQuery.length > 0 || (filters.amountRanges?.length || 0) > 0 || (filters.maxRaisedRanges?.length || 0) > 0 || (filters.states?.length || 0) > 0;
  return (
    <div className="h-full relative z-10 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h2 className="font-semibold">Filters</h2>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto p-4 space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Search</Label>
          <Input 
            placeholder="Search companies, industries..." 
            value={searchQuery} 
            onChange={e => handleSearchChange(e.target.value)} 
          />
        </div>

        {/* Technology Industry */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Technology Industry</Label>
          <div className="space-y-2">
            {techIndustries.map(industry => (
              <div key={industry} className="flex items-center space-x-2">
                <Checkbox 
                  id={industry} 
                  checked={filters.industries.includes(industry)} 
                  onCheckedChange={() => handleIndustryToggle(industry)} 
                />
                <Label htmlFor={industry} className="text-sm cursor-pointer flex-1">
                  {industry}
                </Label>
              </div>
            ))}
          </div>
          
          {filters.industries.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.industries.map(industry => (
                <Badge 
                  key={industry} 
                  variant="secondary" 
                  className="text-xs cursor-pointer" 
                  onClick={() => handleIndustryToggle(industry)}
                >
                  {industry}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Amount Raised */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Amount Raised</Label>
          <div className="space-y-2">
            {amountRanges.map(range => (
              <div key={range} className="flex items-center space-x-2">
                <Checkbox 
                  id={range} 
                  checked={filters.amountRanges?.includes(range) || false} 
                  onCheckedChange={() => handleAmountRangeToggle(range)} 
                />
                <Label htmlFor={range} className="text-sm cursor-pointer flex-1">
                  {range}
                </Label>
              </div>
            ))}
          </div>
          
          {(filters.amountRanges?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.amountRanges?.map(range => (
                <Badge 
                  key={range} 
                  variant="secondary" 
                  className="text-xs cursor-pointer" 
                  onClick={() => handleAmountRangeToggle(range)}
                >
                  {range}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Amount Sold */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Amount Sold</Label>
          <div className="space-y-2">
            {maxRaisedRanges.map(range => (
              <div key={range} className="flex items-center space-x-2">
                <Checkbox 
                  id={`max-${range}`} 
                  checked={filters.maxRaisedRanges?.includes(range) || false} 
                  onCheckedChange={() => handleMaxRaisedToggle(range)} 
                />
                <Label htmlFor={`max-${range}`} className="text-sm cursor-pointer flex-1">
                  {range}
                </Label>
              </div>
            ))}
          </div>
          
          {(filters.maxRaisedRanges?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.maxRaisedRanges?.map(range => (
                <Badge 
                  key={range} 
                  variant="secondary" 
                  className="text-xs cursor-pointer" 
                  onClick={() => handleMaxRaisedToggle(range)}
                >
                  {range}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* State */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">State</Label>
          <div className="space-y-2">
            {states.map(state => (
              <div key={state.code} className="flex items-center space-x-2">
                <Checkbox 
                  id={state.code} 
                  checked={filters.states?.includes(state.code) || false} 
                  onCheckedChange={() => handleStateToggle(state.code)} 
                />
                <Label htmlFor={state.code} className="text-sm cursor-pointer flex-1">
                  {state.name} ({state.code})
                </Label>
              </div>
            ))}
          </div>
          
          {(filters.states?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.states?.map(stateCode => {
                const state = states.find(s => s.code === stateCode);
                return (
                  <Badge 
                    key={stateCode} 
                    variant="secondary" 
                    className="text-xs cursor-pointer" 
                    onClick={() => handleStateToggle(stateCode)}
                  >
                    {state?.name || stateCode}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground text-center">
            {filters.industries.length} industries, {filters.amountRanges?.length || 0} amounts, {filters.maxRaisedRanges?.length || 0} amount sold, {filters.states?.length || 0} states selected
          </p>
        )}
        
        {/* Data Dictionary Button */}
        <div className="space-y-2">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/sec/data-dictionary" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Data Dictionary
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Learn about all available data fields and filtering options
          </p>
        </div>
      </div>
    </div>
  );
};