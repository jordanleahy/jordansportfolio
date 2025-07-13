import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Filter, RotateCcw, TrendingUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useIndustries } from "@/hooks/useSecQueries";

interface FilterSidebarProps {
  filters: {
    industries: string[];
    amountRange: [number, number];
    searchQuery: string;
  };
  onFiltersChange: (filters: any) => void;
  onClose?: () => void;
  activeTechReport?: boolean;
  onApplyTechReport?: () => void;
  onClearTechReport?: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  filters, 
  onFiltersChange, 
  onClose,
  activeTechReport = false,
  onApplyTechReport,
  onClearTechReport
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const { data: industriesData, isLoading: industriesLoading } = useIndustries();

  // Use real industries from database, fallback to hardcoded list
  const industries = industriesData || [
    "Pooled Investment Fund",
    "Other",
    "Other Technology", 
    "Commercial",
    "Other Real Estate",
    "Residential",
    "Other Health Care",
    "Investing",
    "Biotechnology",
    "Other Banking and Financial Services",
    "REITS and Finance",
    "Insurance",
    "Oil and Gas",
    "Business Services",
    "Manufacturing",
    "Retailing",
    "Pharmaceuticals",
    "Other Energy",
    "Restaurants",
    "Agriculture"
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

  const handleAmountRangeChange = (value: [number, number]) => {
    setLocalFilters({
      ...localFilters,
      amountRange: value
    });
  };

  const handleSearchChange = (value: string) => {
    setLocalFilters({
      ...localFilters,
      searchQuery: value
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose?.();
  };

  const resetFilters = () => {
    const resetFilters = {
      industries: [],
      amountRange: [0, 100000000] as [number, number],
      searchQuery: ""
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  const hasActiveFilters = localFilters.industries.length > 0 || 
    localFilters.amountRange[0] > 0 || 
    localFilters.amountRange[1] < 100000000 ||
    localFilters.searchQuery.length > 0;

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
        {/* Quick Presets */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Quick Presets</Label>
          {!activeTechReport ? (
            <Button 
              onClick={onApplyTechReport}
              variant="outline"
              size="sm"
              className="w-full flex items-center gap-2 justify-start"
            >
              <TrendingUp className="h-4 w-4" />
              Tech Companies Under $5M
            </Button>
          ) : (
            <div className="flex items-center justify-between p-2 border rounded-md bg-secondary/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Tech Report Active</span>
              </div>
              <Button 
                onClick={onClearTechReport}
                variant="ghost"
                size="sm"
                className="h-6 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <Separator />
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
          <Label className="text-sm font-semibold">Industry</Label>
          <div className="space-y-2">
            {industries.map((industry) => (
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
        <div className="space-y-4">
          <Label className="text-sm font-semibold">Amount Raised Range</Label>
          
          <div className="px-2">
            <Slider
              value={localFilters.amountRange}
              onValueChange={handleAmountRangeChange}
              max={100000000}
              step={100000}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatCurrency(localFilters.amountRange[0])}</span>
            <span>{formatCurrency(localFilters.amountRange[1])}</span>
          </div>

          {/* Manual Input */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="min-amount" className="text-xs">Min Amount</Label>
              <Input
                id="min-amount"
                type="number"
                placeholder="0"
                value={localFilters.amountRange[0]}
                onChange={(e) => handleAmountRangeChange([
                  parseInt(e.target.value) || 0,
                  localFilters.amountRange[1]
                ])}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="max-amount" className="text-xs">Max Amount</Label>
              <Input
                id="max-amount"
                type="number"
                placeholder="100000000"
                value={localFilters.amountRange[1]}
                onChange={(e) => handleAmountRangeChange([
                  localFilters.amountRange[0],
                  parseInt(e.target.value) || 100000000
                ])}
                className="h-8"
              />
            </div>
          </div>
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
            {localFilters.industries.length} industries selected
          </p>
        )}
      </CardContent>
    </Card>
  );
};