import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Filter, RotateCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useIndustries } from "@/hooks/useSecQueries";

interface FilterSidebarProps {
  filters: {
    industries: string[];
    searchQuery: string;
    fullySold?: boolean;
    amountRanges?: string[];
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
  const [localFilters, setLocalFilters] = useState({
    industries: [],
    searchQuery: "",
    fullySold: false,
    amountRanges: [],
    states: [],
    ...filters
  });

  // Technology-focused industries only
  const techIndustries = [
    "Other Technology",
    "Computer Software", 
    "Biotechnology",
    "Computer Hardware",
    "Internet",
    "Software",
    "Technology",
    "Telecommunications",
    "Computer Services",
    "Electronics",
    "Information Technology",
    "Media & Entertainment",
    "FinTech",
    "E-commerce"
  ];

  // Amount ranges
  const amountRanges = [
    "Less than $500k",
    "$500k - $2MM",
    "$2MM - $5MM", 
    "$5MM+"
  ];

  // States
  const states = [
    { code: "NY", name: "New York" },
    { code: "NJ", name: "New Jersey" },
    { code: "IL", name: "Illinois" },
    { code: "CA", name: "California" },
    { code: "TN", name: "Tennessee" }
  ];

  const handleIndustryToggle = (industry: string) => {
    const updatedIndustries = localFilters.industries.includes(industry)
      ? localFilters.industries.filter(i => i !== industry)
      : [...localFilters.industries, industry];
    
    setLocalFilters({
      ...localFilters,
      industries: updatedIndustries
    });
  };

  const handleSearchChange = (value: string) => {
    setLocalFilters({
      ...localFilters,
      searchQuery: value
    });
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose?.();
  };

  const handleAmountRangeToggle = (range: string) => {
    const updatedRanges = localFilters.amountRanges?.includes(range)
      ? localFilters.amountRanges.filter(r => r !== range)
      : [...(localFilters.amountRanges || []), range];
    
    setLocalFilters({
      ...localFilters,
      amountRanges: updatedRanges
    });
  };

  const handleStateToggle = (stateCode: string) => {
    const updatedStates = localFilters.states?.includes(stateCode)
      ? localFilters.states.filter(s => s !== stateCode)
      : [...(localFilters.states || []), stateCode];
    
    setLocalFilters({
      ...localFilters,
      states: updatedStates
    });
  };

  const resetFilters = () => {
    const resetFilters = {
      industries: [],
      searchQuery: "",
      fullySold: false,
      amountRanges: [],
      states: []
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const hasActiveFilters = localFilters.industries.length > 0 || 
    localFilters.searchQuery.length > 0 ||
    (localFilters.amountRanges?.length || 0) > 0 ||
    (localFilters.states?.length || 0) > 0;

  return (
    <Card className="flex flex-col h-full relative z-10 bg-background border shadow-sm">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 px-2"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-6">
        {/* Search Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Search</Label>
          <Input
            placeholder="Search companies, industries..."
            value={localFilters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Industry Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Technology Industry</Label>
          <div className="space-y-2">
            {techIndustries.map((industry) => (
              <div key={industry} className="flex items-center space-x-2">
                <Checkbox
                  id={industry}
                  checked={localFilters.industries.includes(industry)}
                  onCheckedChange={() => handleIndustryToggle(industry)}
                />
                <Label 
                  htmlFor={industry} 
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {industry}
                </Label>
              </div>
            ))}
          </div>
          
          {/* Selected Industries */}
          {localFilters.industries.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {localFilters.industries.map((industry) => (
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

        <Separator />

        {/* Amount Range Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Amount Raised</Label>
          <div className="space-y-2">
            {amountRanges.map((range) => (
              <div key={range} className="flex items-center space-x-2">
                <Checkbox
                  id={range}
                  checked={localFilters.amountRanges?.includes(range) || false}
                  onCheckedChange={() => handleAmountRangeToggle(range)}
                />
                <Label 
                  htmlFor={range} 
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {range}
                </Label>
              </div>
            ))}
          </div>
          
          {/* Selected Amount Ranges */}
          {(localFilters.amountRanges?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {localFilters.amountRanges?.map((range) => (
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

        <Separator />

        {/* State Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">State</Label>
          <div className="space-y-2">
            {states.map((state) => (
              <div key={state.code} className="flex items-center space-x-2">
                <Checkbox
                  id={state.code}
                  checked={localFilters.states?.includes(state.code) || false}
                  onCheckedChange={() => handleStateToggle(state.code)}
                />
                <Label 
                  htmlFor={state.code} 
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {state.name} ({state.code})
                </Label>
              </div>
            ))}
          </div>
          
          {/* Selected States */}
          {(localFilters.states?.length || 0) > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {localFilters.states?.map((stateCode) => {
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

        <Separator />

        {/* Apply Filters Button */}
        <Button 
          onClick={applyFilters} 
          className="w-full"
          disabled={!hasActiveFilters && JSON.stringify(localFilters) === JSON.stringify(filters)}
        >
          Apply Filters
        </Button>
        
        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground text-center">
            {localFilters.industries.length} industries, {localFilters.amountRanges?.length || 0} amounts, {localFilters.states?.length || 0} states selected
          </p>
        )}
      </CardContent>
    </Card>
  );
};